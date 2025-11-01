"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { AuthService } from "@/lib/auth";

export default function ProfilePage() {
  const { admin, refreshAdmin } = useAdmin();
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Personal information
  const [personalInfo, setPersonalInfo] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });


  // Load admin data
  useEffect(() => {
    if (admin) {
      setPersonalInfo({
        first_name: admin.first_name || "",
        last_name: admin.last_name || "",
        email: admin.email || "",
        phone: admin.phone || "",
      });
    }
  }, [admin]);

  const handleSavePersonalInfo = async () => {
    if (!admin) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      // Update in Supabase
      const updatedAdmin = await AuthService.updateAdminProfile(admin.id, {
        first_name: personalInfo.first_name,
        last_name: personalInfo.last_name,
        phone: personalInfo.phone,
      });
      
      // Update localStorage with fresh data
      if (updatedAdmin) {
        AuthService.setCurrentUser(updatedAdmin);
      }
      
      // Refresh context to show updated data
      await refreshAdmin();
      setIsEditingPersonal(false);
      setMessage({ type: 'success', text: 'Informations personnelles mises à jour avec succès !' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || "Erreur lors de la mise à jour" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!admin) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // Verify current password by attempting sign in
      try {
        await AuthService.signIn(admin.email, passwordData.currentPassword);
      } catch (signInError) {
        setMessage({ type: 'error', text: 'Mot de passe actuel incorrect' });
        setSaving(false);
        return;
      }

      // Update password
      const updatedAdmin = await AuthService.updateAdminProfile(admin.id, {
        password: passwordData.newPassword, // In production, hash this
      });

      // Update localStorage with fresh data
      if (updatedAdmin) {
        AuthService.setCurrentUser(updatedAdmin);
      }

      // Refresh context to show updated data
      await refreshAdmin();

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || "Erreur lors du changement de mot de passe" });
    } finally {
      setSaving(false);
    }
  };


  if (!admin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#007BFF] mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  const initials = `${admin.first_name?.[0] || ''}${admin.last_name?.[0] || ''}`.toUpperCase() || 'AD';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-600 mt-1">Gérez vos informations personnelles et vos paramètres de sécurité</p>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <p>{message.text}</p>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-[#007BFF] to-blue-600 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-[#007BFF] font-bold text-3xl">
              {initials}
            </span>
          </div>
          <div className="text-white">
            <h2 className="text-2xl font-bold">
              {admin.first_name} {admin.last_name}
            </h2>
            <p className="text-blue-100 mt-1">{admin.email}</p>
            <p className="text-blue-100 text-sm mt-2">
              Membre depuis {new Date(admin.created_at).toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Three Main Sections */}
      <div className="grid grid-cols-1 gap-6">
        {/* Section 1: Informations Personnelles */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Informations Personnelles</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {!isEditingPersonal ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Prénom</label>
                      <p className="text-gray-900 mt-1">{personalInfo.first_name || 'Non défini'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Nom</label>
                      <p className="text-gray-900 mt-1">{personalInfo.last_name || 'Non défini'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                      <p className="text-gray-900 mt-1">{personalInfo.email}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Téléphone</label>
                      <p className="text-gray-900 mt-1">{personalInfo.phone || 'Non défini'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingPersonal(true)}
                    className="w-full bg-[#007BFF] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Modifier</span>
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <input
                      type="text"
                      value={personalInfo.first_name}
                      onChange={(e) => setPersonalInfo({...personalInfo, first_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                      placeholder="Prénom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={personalInfo.last_name}
                      onChange={(e) => setPersonalInfo({...personalInfo, last_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                      placeholder="Nom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={personalInfo.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      placeholder="Email (non modifiable)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditingPersonal(false);
                        setPersonalInfo({
                          first_name: admin.first_name || "",
                          last_name: admin.last_name || "",
                          email: admin.email || "",
                          phone: admin.phone || "",
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSavePersonalInfo}
                      disabled={saving}
                      className="flex-1 bg-[#007BFF] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Mot de passe */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Mot de passe</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {!isChangingPassword ? (
                <>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      Pour des raisons de sécurité, votre mot de passe est masqué. Cliquez sur le bouton ci-dessous pour le modifier.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>Changer le mot de passe</span>
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                      placeholder="Entrez votre mot de passe actuel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                      placeholder="Nouveau mot de passe (min. 6 caractères)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                      placeholder="Confirmez le nouveau mot de passe"
                    />
                  </div>
                  {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-sm text-red-600">Les mots de passe ne correspondent pas</p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Conditions de sécurité */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Sécurité</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Sécurité de votre compte</h4>
                      <p className="text-sm text-blue-700">
                        Votre compte est protégé par un système de sécurité robuste. Assurez-vous de maintenir un mot de passe fort et de ne jamais le partager avec personne.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Authentification à deux facteurs</h4>
                      <p className="text-xs text-gray-500 mt-1">Ajoute une couche de sécurité supplémentaire à votre compte</p>
                    </div>
                    <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      Recommandé
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Alertes de connexion</h4>
                      <p className="text-xs text-gray-500 mt-1">Vous serez notifié lors de nouvelles connexions suspectes</p>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Activé
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Sessions actives</h4>
                      <p className="text-xs text-gray-500 mt-1">Votre session expire automatiquement après une période d'inactivité</p>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Protégé
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">Conseils de sécurité</h4>
                      <ul className="text-sm text-yellow-700 space-y-1 mt-2">
                        <li>• Utilisez un mot de passe unique et fort</li>
                        <li>• Ne partagez jamais vos identifiants</li>
                        <li>• Déconnectez-vous après chaque session</li>
                        <li>• Signalez toute activité suspecte immédiatement</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
