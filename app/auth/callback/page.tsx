"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from URL (Supabase adds tokens in the hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const error = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");

        if (error) {
          setStatus("error");
          setMessage(errorDescription || error || "Une erreur s'est produite lors de la confirmation.");
          return;
        }

        // If we have an access token, the email was confirmed
        if (accessToken) {
          // Set the session
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || "",
          });

          if (sessionError) {
            throw sessionError;
          }

          setStatus("success");
          setMessage("Votre email a été confirmé avec succès ! Votre compte sera activé prochainement par un administrateur.");
        } else {
          // Check query params (alternative method)
          const token = searchParams.get("token");
          const type = searchParams.get("type");

          if (token && type === "signup") {
            setStatus("success");
            setMessage("Votre email a été confirmé avec succès ! Votre compte sera activé prochainement par un administrateur.");
          } else {
            setStatus("error");
            setMessage("Token de confirmation invalide ou manquant.");
          }
        }
      } catch (error: any) {
        console.error("Error handling auth callback:", error);
        setStatus("error");
        setMessage(error?.message || "Une erreur s'est produite lors de la confirmation de votre email.");
      }
    };

    handleAuthCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {status === "loading" && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#007BFF] mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Traitement en cours...</h1>
            <p className="text-gray-600">Veuillez patienter pendant la confirmation de votre email.</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email confirmé !</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push("/")}
              className="bg-[#007BFF] text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push("/")}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

