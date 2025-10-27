"use client";

import { useAdmin } from "../contexts/AdminContext";

export default function AdminInfo() {
  const { admin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="text-gray-500 text-sm">
        Aucune information d'administrateur disponible
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-3">Informations Administrateur</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Nom complet:</span>
          <span className="font-medium">{admin.first_name} {admin.last_name}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Email:</span>
          <span className="font-medium">{admin.email}</span>
        </div>
        
        {admin.phone && (
          <div className="flex justify-between">
            <span className="text-gray-600">Téléphone:</span>
            <span className="font-medium">{admin.phone}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-600">Membre depuis:</span>
          <span className="font-medium">
            {new Date(admin.created_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>
    </div>
  );
}
