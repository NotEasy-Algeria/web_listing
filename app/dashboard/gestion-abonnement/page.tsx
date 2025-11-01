"use client";

import { useState, useEffect } from "react";
import { DatabaseService } from "../../../lib/database";

interface Doctor { id: string; first_name?: string; last_name?: string; email?: string; field?: string; status?: boolean; }
interface Abonnement { 
  id: string; 
  id_doctor: string; 
  price: number; 
  type: string; 
  count: number;
  start: string; 
  end_date: string; 
  created_at: string;
  doctors?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export default function GestionAbonnementPage() {
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForDoctor, setCreateForDoctor] = useState<Doctor | null>(null);
  const [form, setForm] = useState({ type: "", price: "", start: "", end_date: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAbonnement, setViewAbonnement] = useState<Abonnement | null>(null);
  const [editAbonnement, setEditAbonnement] = useState<Abonnement | null>(null);
  const [editForm, setEditForm] = useState({ type: "", price: "", start: "", end_date: "" });
  const [deleteAbonnement, setDeleteAbonnement] = useState<Abonnement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        console.log('Loading data from Supabase...');
        const [docs, abos] = await Promise.all([
          DatabaseService.getPendingDoctors(),
          DatabaseService.getAbonnements(),
        ]);
        console.log('Pending doctors:', docs);
        console.log('Abonnements:', abos);
        setPendingDoctors(docs || []);
        setAbonnements(abos || []);
      } catch (e: any) {
        console.error('Error loading data:', e);
        setError(e?.message || "Erreur de chargement des données");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openCreate = (doctor: Doctor) => {
    setCreateForDoctor(doctor);
    // Set start date to today automatically
    const today = new Date().toISOString().split('T')[0];
    setForm({ type: "", price: "", start: today, end_date: "" });
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForDoctor) return;
    const price = parseFloat(form.price);
    if (Number.isNaN(price)) return alert("Prix invalide");
    
    // Validate dates
    if (!form.start || !form.end_date) {
      return alert("Veuillez remplir toutes les dates");
    }
    
    if (new Date(form.end_date) < new Date(form.start)) {
      return alert("La date de fin doit être supérieure ou égale à la date de début");
    }
    
    try {
      // Get all existing abonnements for this doctor from database to calculate count
      const allAbonnements = await DatabaseService.getAbonnements();
      const existingAbonnements = allAbonnements.filter(ab => ab.id_doctor === createForDoctor.id);
      const currentCount = existingAbonnements.length;
      const newCount = currentCount + 1;
      
      // Create the abonnement with calculated count
      await DatabaseService.createAbonnement({
        id_doctor: createForDoctor.id,
        type: form.type,
        price,
        start: form.start,
        end_date: form.end_date,
        count: newCount,
      });
      
      // Update doctor status to true (active)
      await DatabaseService.updateDoctor(createForDoctor.id, { status: true as any });
      
      // Refresh both lists
      const [docs, abos] = await Promise.all([
        DatabaseService.getPendingDoctors(),
        DatabaseService.getAbonnements(),
      ]);
      setPendingDoctors(docs || []);
      setAbonnements(abos || []);
      
      setCreateOpen(false);
      setCreateForDoctor(null);
      setForm({ type: "", price: "", start: "", end_date: "" });
    } catch (e: any) {
      let errorMessage = "Erreur lors de la création de l'abonnement";
      if (e?.message) {
        if (e.message.includes("abonnements_date_check")) {
          errorMessage = "La date de fin doit être supérieure ou égale à la date de début";
        } else {
          errorMessage = e.message;
        }
      }
      alert(errorMessage);
    }
  };

  const openEdit = (abonnement: Abonnement) => {
    setEditAbonnement(abonnement);
    setEditForm({
      type: abonnement.type,
      price: abonnement.price.toString(),
      start: abonnement.start,
      end_date: abonnement.end_date,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAbonnement) return;
    const price = parseFloat(editForm.price);
    if (Number.isNaN(price)) return alert("Prix invalide");
    
    // Validate dates
    if (!editForm.start || !editForm.end_date) {
      return alert("Veuillez remplir toutes les dates");
    }
    
    if (new Date(editForm.end_date) < new Date(editForm.start)) {
      return alert("La date de fin doit être supérieure ou égale à la date de début");
    }
    
    try {
      await DatabaseService.updateAbonnement(editAbonnement.id, {
        type: editForm.type,
        price,
        start: editForm.start,
        end_date: editForm.end_date,
      });
      const abos = await DatabaseService.getAbonnements();
      setAbonnements(abos || []);
      setEditAbonnement(null);
    } catch (e: any) {
      let errorMessage = "Erreur lors de la mise à jour de l'abonnement";
      if (e?.message) {
        if (e.message.includes("abonnements_date_check")) {
          errorMessage = "La date de fin doit être supérieure ou égale à la date de début";
        } else {
          errorMessage = e.message;
        }
      }
      alert(errorMessage);
    }
  };

  const handleDeleteAbonnement = async () => {
    if (!deleteAbonnement) return;
    
    try {
      // Delete the abonnement
      await DatabaseService.deleteAbonnement(deleteAbonnement.id);
      
      // Update doctor status to false
      await DatabaseService.updateDoctor(deleteAbonnement.id_doctor, { status: false as any });
      
      // Refresh both lists
      const [docs, abos] = await Promise.all([
        DatabaseService.getPendingDoctors(),
        DatabaseService.getAbonnements(),
      ]);
      setPendingDoctors(docs || []);
      setAbonnements(abos || []);
      
      setDeleteAbonnement(null);
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la suppression de l'abonnement");
    }
  };

  const filteredAbos = abonnements.filter(sub => {
    const doctorName = `${sub.doctors?.first_name || ''} ${sub.doctors?.last_name || ''}`.toLowerCase();
    const doctorEmail = sub.doctors?.email?.toLowerCase() || '';
    const matchesSearch = sub.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctorName.includes(searchTerm.toLowerCase()) ||
                         doctorEmail.includes(searchTerm.toLowerCase()) ||
                         sub.id_doctor.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "expired": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Actif";
      case "expired": return "Expiré";
      case "cancelled": return "Annulé";
      case "pending": return "En attente";
      default: return status;
    }
  };

  const totalRevenue = abonnements.reduce((sum, sub) => sum + sub.price, 0);
  
  // Calculate active and expired subscriptions dynamically based on dates
  const today = new Date().toISOString().split('T')[0];
  const activeSubscriptions = abonnements.filter(sub => {
    return sub.end_date >= today;
  }).length;
  
  const expiredSubscriptions = abonnements.filter(sub => {
    return sub.end_date < today;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Abonnements</h1>
          <p className="text-gray-600 mt-1">Gérez les abonnements et les plans de vos utilisateurs</p>
        </div>
        <button className="bg-[#007BFF] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nouveau Plan</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Abonnements Actifs</p>
              <p className="text-2xl font-bold text-green-600">{activeSubscriptions}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expirés</p>
              <p className="text-2xl font-bold text-red-600">{expiredSubscriptions}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus Mensuels</p>
              <p className="text-2xl font-bold text-[#007BFF]">{totalRevenue.toFixed(2)} DA</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Docteurs sans abonnement (status=false) */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#007BFF] to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Docteurs en attente</h3>
              <p className="text-sm text-gray-500 mt-1">Docteurs sans abonnement actif</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100">
            <span className="text-lg font-bold text-[#007BFF]">{pendingDoctors.length}</span>
            <span className="text-sm text-gray-600 font-medium">docteurs</span>
          </div>
        </div>
        
        {pendingDoctors.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Aucun docteur en attente</p>
            <p className="text-sm text-gray-400 mt-1">Tous les docteurs ont un abonnement actif</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingDoctors.map((doc, index) => (
              <div
                key={doc.id}
                className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:border-[#007BFF]/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Animated border gradient on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#007BFF] to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#007BFF] to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        {(doc.first_name?.[0] || 'D') + (doc.last_name?.[0] || 'R')}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-[#007BFF] transition-colors duration-300">
                          {doc.first_name || '—'} {doc.last_name || ''}
                        </h4>
                        {doc.field && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            {doc.field}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {doc.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{doc.email}</span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => openCreate(doc)}
                    className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-[#007BFF] to-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <span className="relative z-10 flex items-center space-x-2">
                      <svg className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Créer un abonnement</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher un abonnement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Erreur: {error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007BFF]"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      )}

      {/* Abonnements Table */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docteur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAbos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium">Aucun abonnement trouvé</p>
                        <p className="text-sm mt-1">Les abonnements apparaîtront ici une fois créés</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAbos.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#007BFF] rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-medium text-sm">
                          {(subscription.doctors?.first_name?.[0] || 'D') + (subscription.doctors?.last_name?.[0] || 'R')}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {subscription.doctors?.first_name || '—'} {subscription.doctors?.last_name || ''}
                        </div>
                        {subscription.doctors?.email && (
                          <div className="text-sm text-gray-500">{subscription.doctors.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{subscription.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{subscription.start}</div>
                    <div>{subscription.end_date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {subscription.price} DA 
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => setViewAbonnement(subscription)}
                        className="text-[#007BFF] hover:text-blue-700 p-1 transition-colors" 
                        title="Voir détails"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => openEdit(subscription)}
                        className="text-green-600 hover:text-green-700 p-1 transition-colors" 
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setDeleteAbonnement(subscription)}
                        className="text-red-600 hover:text-red-700 p-1 transition-colors" 
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Abonnement Modal */}
      {createOpen && createForDoctor && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity z-40" onClick={() => setCreateOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="relative z-50 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Créer un abonnement pour {createForDoctor.first_name || 'Docteur'}</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <input type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent" placeholder="Ex: Premium" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix (DA)</label>
                    <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent" placeholder="0.00" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                      <input type="date" value={form.start} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed" required />
                      <p className="text-xs text-gray-500 mt-1">Date automatiquement définie à aujourd'hui</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                      <input 
                        type="date" 
                        value={form.end_date} 
                        min={form.start || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent" 
                        required 
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button type="button" onClick={handleCreate} className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-[#007BFF] text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007BFF] sm:ml-3 sm:w-auto sm:text-sm">Créer</button>
                <button type="button" onClick={() => setCreateOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Abonnement Details Modal */}
      {viewAbonnement && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity z-40" onClick={() => setViewAbonnement(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="relative z-50 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Détails de l'abonnement</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Docteur</label>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-[#007BFF] rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-xs">
                              {(viewAbonnement.doctors?.first_name?.[0] || 'D') + (viewAbonnement.doctors?.last_name?.[0] || 'R')}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-900 font-medium">
                              {viewAbonnement.doctors?.first_name || '—'} {viewAbonnement.doctors?.last_name || ''}
                            </p>
                            {viewAbonnement.doctors?.email && (
                              <p className="text-xs text-gray-500">{viewAbonnement.doctors.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Type d'abonnement</label>
                        <p className="text-sm text-gray-900 font-medium">{viewAbonnement.type}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Date de début</label>
                          <p className="text-sm text-gray-900">{viewAbonnement.start}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Date de fin</label>
                          <p className="text-sm text-gray-900">{viewAbonnement.end_date}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Prix</label>
                        <p className="text-lg font-semibold text-[#007BFF]">{viewAbonnement.price} DA</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Date de création</label>
                        <p className="text-sm text-gray-900">{new Date(viewAbonnement.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={() => setViewAbonnement(null)} 
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-[#007BFF] text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007BFF] sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Abonnement Modal */}
      {editAbonnement && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity z-40" onClick={() => setEditAbonnement(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="relative z-50 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Modifier l'abonnement</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <input 
                      type="text" 
                      value={editForm.type} 
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent" 
                      placeholder="Ex: Premium" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix (DA)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={editForm.price} 
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent" 
                      placeholder="0.00" 
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                      <input 
                        type="date" 
                        value={editForm.start} 
                        onChange={(e) => setEditForm({ ...editForm, start: e.target.value })} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                      <input 
                        type="date" 
                        value={editForm.end_date} 
                        min={editForm.start || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent" 
                        required 
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={handleUpdate} 
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Enregistrer
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditAbonnement(null)} 
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Abonnement Confirmation Modal */}
      {deleteAbonnement && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity z-40" onClick={() => setDeleteAbonnement(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="relative z-50 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Supprimer l'abonnement</h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Êtes-vous sûr de vouloir supprimer cet abonnement ? 
                  Cette action supprimera l'abonnement et changera le statut du docteur à "en attente".
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium mb-2">Détails de l'abonnement :</div>
                    <div className="space-y-1 text-gray-600">
                      <div>Type: <span className="font-medium">{deleteAbonnement.type}</span></div>
                      <div>Prix: <span className="font-medium">{deleteAbonnement.price} DA</span></div>
                      <div>Période: <span className="font-medium">{deleteAbonnement.start} - {deleteAbonnement.end_date}</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={handleDeleteAbonnement} 
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Supprimer
                </button>
                <button 
                  type="button" 
                  onClick={() => setDeleteAbonnement(null)} 
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
