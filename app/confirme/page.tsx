"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function ConfirmeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const hasProcessed = useRef(false); // Prevent multiple processing
  const processingStartTime = useRef<number | null>(null);

  // Security: Validate token format
  const isValidTokenFormat = (token: string | null): boolean => {
    if (!token) return false;
    // JWT tokens are base64 encoded and have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    // Check if each part is valid base64
    try {
      parts.forEach(part => {
        atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      });
      return true;
    } catch {
      return false;
    }
  };

  // Security: Check if request is from valid origin
  const isValidOrigin = (): boolean => {
    if (typeof window === 'undefined') return false;
    const origin = window.location.origin;
    const validOrigins = [
      'https://web-listing.vercel.app',
      'http://localhost:3000', // For development
      'http://localhost:3001', // For development
    ];
    return validOrigins.includes(origin);
  };

  // Security: Rate limiting - prevent too many attempts
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const lastAttempt = localStorage.getItem('confirmation_last_attempt');
    const attemptCount = parseInt(localStorage.getItem('confirmation_attempts') || '0', 10);
    
    if (lastAttempt) {
      const timeSinceLastAttempt = now - parseInt(lastAttempt, 10);
      // Reset counter after 1 hour
      if (timeSinceLastAttempt > 3600000) {
        localStorage.setItem('confirmation_attempts', '0');
        localStorage.setItem('confirmation_last_attempt', now.toString());
        return true;
      }
      
      // Allow max 5 attempts per hour
      if (attemptCount >= 5) {
        return false;
      }
    }
    
    return true;
  };

  // Security: Record attempt
  const recordAttempt = (success: boolean) => {
    const now = Date.now();
    const attemptCount = parseInt(localStorage.getItem('confirmation_attempts') || '0', 10);
    
    if (success) {
      // Reset on success
      localStorage.removeItem('confirmation_attempts');
      localStorage.removeItem('confirmation_last_attempt');
    } else {
      // Increment on failure
      localStorage.setItem('confirmation_attempts', (attemptCount + 1).toString());
      localStorage.setItem('confirmation_last_attempt', now.toString());
    }
  };

  useEffect(() => {
    const handleConfirmation = async () => {
      // Security: Prevent multiple simultaneous processing
      if (hasProcessed.current) {
        return;
      }
      hasProcessed.current = true;
      processingStartTime.current = Date.now();

      try {
        // Security: Validate origin
        if (!isValidOrigin()) {
          console.error('Invalid origin:', window.location.origin);
          setStatus("error");
          setMessage("Requête non autorisée. Veuillez utiliser le lien fourni dans votre email.");
          recordAttempt(false);
          return;
        }

        // Security: Rate limiting
        if (!checkRateLimit()) {
          setStatus("error");
          setMessage("Trop de tentatives. Veuillez patienter avant de réessayer ou contacter le support.");
          recordAttempt(false);
          return;
        }

        // Supabase Auth sends tokens in the URL hash (#access_token=...&type=...)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const tokenType = hashParams.get("type");
        
        // Also check query params as fallback
        const queryToken = searchParams.get("token");
        const queryType = searchParams.get("type");

        // Security: Validate token format
        if (accessToken && !isValidTokenFormat(accessToken)) {
          console.error('Invalid access token format');
          setStatus("error");
          setMessage("Format de token invalide. Veuillez utiliser le lien fourni dans votre email.");
          recordAttempt(false);
          return;
        }

        // Security: Check token length (JWT tokens are typically long)
        if (accessToken && (accessToken.length < 100 || accessToken.length > 2000)) {
          console.error('Suspicious token length:', accessToken.length);
          setStatus("error");
          setMessage("Token de confirmation invalide. Veuillez vérifier le lien dans votre email.");
          recordAttempt(false);
          return;
        }

        // If we have tokens in the hash (Supabase Auth standard format)
        if (accessToken && refreshToken) {
          try {
            // Security: Set timeout for the operation
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Timeout: La confirmation a pris trop de temps')), 30000);
            });

            // Set the session using the tokens from the hash
            const sessionPromise = supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            const { data: { session }, error: sessionError } = await Promise.race([
              sessionPromise,
              timeoutPromise
            ]) as any;

            if (sessionError) {
              // Security: Log error but don't expose details
              console.error("Session error:", sessionError.message);
              
              // Check for specific error types
              if (sessionError.message?.includes('expired') || sessionError.message?.includes('invalid')) {
                setStatus("error");
                setMessage("Le lien de confirmation a expiré ou est invalide. Veuillez demander un nouveau lien de confirmation.");
              } else {
                setStatus("error");
                setMessage("Erreur lors de la confirmation. Veuillez réessayer ou contacter le support.");
              }
              recordAttempt(false);
              return;
            }

            if (session?.user) {
              // Security: Verify user email is confirmed
              if (!session.user.email_confirmed_at) {
                // Try to confirm the email
                const { error: confirmError } = await supabase.auth.updateUser({
                  email_confirm: true
                });
                
                if (confirmError) {
                  console.error("Error confirming email:", confirmError);
                }
              }

              // Security: Verify the user exists in doctors table
              const { data: doctorData, error: doctorError } = await supabase
                .from('doctors')
                .select('id, email, status')
                .eq('email', session.user.email)
                .single();
              
              if (doctorError || !doctorData) {
                console.error("Doctor not found:", doctorError);
                setStatus("error");
                setMessage("Compte non trouvé. Veuillez contacter le support.");
                recordAttempt(false);
                return;
              }

              // Security: Update doctor record with timestamp
              const { error: updateError } = await supabase
                .from('doctors')
                .update({ 
                  updated_at: new Date().toISOString(),
                  // Optionally set status to true if needed
                })
                .eq('id', doctorData.id);

              if (updateError) {
                console.error("Error updating doctor:", updateError);
                // Don't fail the confirmation if update fails, but log it
              }

              // Security: Clear sensitive data from URL
              window.history.replaceState({}, document.title, '/confirme');
              
              setStatus("success");
              setMessage("Votre email a été confirmé avec succès ! Vous pouvez maintenant vous connecter à l'application.");
              recordAttempt(true);
              
              // Redirect to app after 3 seconds
              setTimeout(() => {
                try {
                  window.location.href = "medicalapp://auth/confirmed";
                } catch (e) {
                  // If deep link fails, show message
                  console.log("Deep link not available, user should open app manually");
                }
              }, 3000);
              return;
            }
          } catch (hashError: any) {
            console.error("Error setting session from hash:", hashError);
            setStatus("error");
            if (hashError.message?.includes('Timeout')) {
              setMessage("La confirmation a pris trop de temps. Veuillez réessayer.");
            } else {
              setMessage("Erreur lors de la confirmation. Veuillez réessayer ou contacter le support.");
            }
            recordAttempt(false);
            return;
          }
        }

        // If we have a token in query params, try to verify it
        if (queryToken) {
          // Security: Validate token format
          if (!isValidTokenFormat(queryToken)) {
            setStatus("error");
            setMessage("Format de token invalide. Veuillez utiliser le lien fourni dans votre email.");
            recordAttempt(false);
            return;
          }

          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: queryToken,
              type: queryType === 'signup' ? 'signup' : 'email'
            });

            if (error) {
              console.error("OTP verification error:", error.message);
              setStatus("error");
              if (error.message?.includes('expired') || error.message?.includes('invalid')) {
                setMessage("Le lien de confirmation a expiré ou est invalide. Veuillez demander un nouveau lien.");
              } else {
                setMessage("Erreur lors de la vérification. Veuillez réessayer.");
              }
              recordAttempt(false);
              return;
            }

            if (data?.user) {
              // Security: Clear sensitive data from URL
              window.history.replaceState({}, document.title, '/confirme');
              
              setStatus("success");
              setMessage("Votre email a été confirmé avec succès ! Vous pouvez maintenant vous connecter à l'application.");
              recordAttempt(true);
              
              setTimeout(() => {
                try {
                  window.location.href = "medicalapp://auth/confirmed";
                } catch (e) {
                  console.log("Deep link not available");
                }
              }, 3000);
              return;
            }
          } catch (otpError: any) {
            console.error("OTP verification exception:", otpError);
            setStatus("error");
            setMessage("Erreur lors de la vérification. Veuillez réessayer ou contacter le support.");
            recordAttempt(false);
            return;
          }
        }

        // If we reach here, no valid token was found
        setStatus("error");
        setMessage("Token de confirmation manquant ou invalide. Veuillez vérifier le lien dans votre email ou contacter le support.");
        recordAttempt(false);
      } catch (error: any) {
        console.error("Error handling confirmation:", error);
        setStatus("error");
        setMessage("Une erreur s'est produite lors de la confirmation de votre email. Veuillez contacter le support.");
        recordAttempt(false);
      }
    };

    handleConfirmation();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {status === "loading" && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#007BFF] mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirmation en cours...</h1>
            <p className="text-gray-600">Veuillez patienter pendant la confirmation de votre email.</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">✅ Email confirmé avec succès !</h1>
            <p className="text-gray-700 mb-2 text-lg font-medium">{message}</p>
            <p className="text-sm text-gray-500 mb-6">
              Votre compte a été activé. Vous pouvez maintenant vous connecter à l'application.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  try {
                    window.location.href = "medicalapp://auth/confirmed";
                  } catch (e) {
                    console.log("Deep link not available");
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md font-semibold text-base"
              >
                Ouvrir l'application
              </button>
              <p className="text-xs text-gray-400 mt-4">
                Redirection automatique dans quelques secondes...
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">❌ Erreur de confirmation</h1>
            <p className="text-gray-700 mb-4 text-lg">{message}</p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left rounded">
              <p className="text-sm text-yellow-800">
                <strong>💡 Que faire ?</strong><br />
                • Vérifiez que vous avez utilisé le lien complet depuis votre email<br />
                • Assurez-vous que le lien n'a pas expiré (valable 24h)<br />
                • Contactez le support si le problème persiste
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/")}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors shadow-md font-semibold text-base"
              >
                Retour à l'accueil
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-md font-semibold text-base"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#007BFF] mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Chargement...</h1>
              <p className="text-gray-600">Veuillez patienter.</p>
            </div>
          </div>
        </div>
      }
    >
      <ConfirmeContent />
    </Suspense>
  );
}
