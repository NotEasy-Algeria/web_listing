"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../../contexts/AdminContext";
import { DatabaseService } from "../../lib/database";

export default function DashboardPage() {
  const { admin } = useAdmin();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    pendingApprovals: 0,
    activeSubscriptions: 0
  });

  const [activities, setActivities] = useState<Array<{ id: string; type: string; message: string; created_at: string }>>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [showAllActivities, setShowAllActivities] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await DatabaseService.getDashboardStats();
        setStats((prev) => ({
          ...prev,
          totalDoctors: result.totalDoctors,
          totalAppointments: result.totalAppointments,
          totalRevenue: result.totalRevenue,
        }));
      } catch (e: any) {
        setError(e?.message || "Impossible de charger les statistiques");
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setActivitiesLoading(true);
        const limit = showAllActivities ? 50 : 8;
        const data = await DatabaseService.getRecentActivities(limit);
        setActivities(data);
      } finally {
        setActivitiesLoading(false);
      }
    };
    loadActivities();
  }, [showAllActivities]);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#007BFF] to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Bienvenue, {admin ? `${admin.first_name} ${admin.last_name}` : 'Admin'}
            </h1>
            <p className="text-blue-100">Voici un aperçu de votre activité aujourd'hui</p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl" role="alert">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Doctors (dynamic) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Docteurs</p>
              <p className="text-3xl font-bold text-gray-900">{isLoading ? '—' : stats.totalDoctors}</p>
              <p className="text-sm text-blue-600 mt-1">
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  {stats.pendingApprovals} en attente
                </span>
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus Mensuels</p>
              <p className="text-3xl font-bold text-gray-900">{isLoading ? '—' : stats.totalRevenue.toLocaleString()} da</p>
              <p className="text-sm text-green-600 mt-1">
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +8.2% vs mois dernier
                </span>
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Activités Récentes */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Activités Récentes</h3>
          <button onClick={() => setShowAllActivities((v) => !v)} className="text-[#007BFF] hover:text-blue-700 text-sm font-medium">
            {showAllActivities ? 'Voir moins' : 'Voir tout'}
            </button>
          </div>
          <div className="space-y-4">
          {activitiesLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
              <div className="h-4 bg-gray-100 rounded w-4/6" />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune activité récente.</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-[#007BFF]/10 rounded-full flex items-center justify-center text-[#007BFF]">
                  {activity.type === 'appointment' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  )}
                  {activity.type === 'user' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  )}
                  {activity.type === 'doctor' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  {activity.type === 'subscription' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString('fr-FR')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Actions Rapides</h3>
        <div className="grid grid-cols-2 gap-4">
          <a href="/dashboard/gestion-admin" className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-[#007BFF] hover:bg-[#007BFF]/5 transition-all group">
            <div className="w-12 h-12 bg-[#007BFF]/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#007BFF]/20">
              <svg className="w-6 h-6 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#007BFF]">Créer Admin</span>
          </a>

          <a href="/dashboard/gestion-doctor" className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-[#007BFF] hover:bg-[#007BFF]/5 transition-all group">
            <div className="w-12 h-12 bg-[#007BFF]/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#007BFF]/20">
              <svg className="w-6 h-6 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#007BFF]">Créer Docteur</span>
          </a>
        </div>
      </div>
    </div>
  );
}
