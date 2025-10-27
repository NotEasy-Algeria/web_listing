"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../../contexts/AdminContext";
import AdminInfo from "../../components/AdminInfo";

export default function DashboardPage() {
  const { admin } = useAdmin();
  const [stats, setStats] = useState({
    totalPatients: 1247,
    totalDoctors: 89,
    totalAppointments: 324,
    totalRevenue: 45680,
    monthlyGrowth: 12.5,
    appointmentsToday: 18,
    pendingApprovals: 7,
    activeSubscriptions: 156
  });

  const recentActivities = [
    {
      id: 1,
      type: "appointment",
      message: "Nouveau rendez-vous avec Dr. Martin",
      time: "Il y a 5 minutes",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 2,
      type: "user",
      message: "Nouvel utilisateur enregistré",
      time: "Il y a 12 minutes",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 3,
      type: "payment",
      message: "Paiement reçu - 150€",
      time: "Il y a 1 heure",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: 4,
      type: "doctor",
      message: "Dr. Sophie Dubois a rejoint l'équipe",
      time: "Il y a 2 heures",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const upcomingAppointments = [
    {
      id: 1,
      patient: "Marie Dupont",
      doctor: "Dr. Martin",
      time: "09:00",
      type: "Consultation"
    },
    {
      id: 2,
      patient: "Jean Pierre",
      doctor: "Dr. Sophie",
      time: "10:30",
      type: "Contrôle"
    },
    {
      id: 3,
      patient: "Alice Bernard",
      doctor: "Dr. Laurent",
      time: "14:00",
      type: "Urgence"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#007BFF] to-blue-600 rounded-xl p-6 text-white hover-lift animate-fade-in animate-gradient">
        <div className="flex items-center justify-between">
          <div className="animate-slide-in-left">
            <h1 className="text-3xl font-bold mb-2">
              Bienvenue, {admin ? `${admin.first_name} ${admin.last_name}` : 'Admin'}
            </h1>
            <p className="text-blue-100">Voici un aperçu de votre activité aujourd'hui</p>
          </div>
          <div className="hidden md:block animate-slide-in-right">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center animate-float hover:scale-110 transition-transform duration-300">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Patients */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover-lift stagger-item hover-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 animate-fade-in">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900 animate-scale-in">{stats.totalPatients.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1 animate-slide-in-left">
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +{stats.monthlyGrowth}% ce mois
                </span>
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 animate-pulse-custom">
              <svg className="w-6 h-6 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Doctors */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover-lift stagger-item hover-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 animate-fade-in">Total Docteurs</p>
              <p className="text-3xl font-bold text-gray-900 animate-scale-in">{stats.totalDoctors}</p>
              <p className="text-sm text-blue-600 mt-1 animate-slide-in-left">
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  {stats.pendingApprovals} en attente
                </span>
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 animate-pulse-custom">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Appointments Today */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover-lift stagger-item hover-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 animate-fade-in">RDV Aujourd'hui</p>
              <p className="text-3xl font-bold text-gray-900 animate-scale-in">{stats.appointmentsToday}</p>
              <p className="text-sm text-orange-600 mt-1 animate-slide-in-left">
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  3 en cours
                </span>
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 animate-pulse-custom">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover-lift stagger-item hover-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 animate-fade-in">Revenus Mensuels</p>
              <p className="text-3xl font-bold text-gray-900 animate-scale-in">{stats.totalRevenue.toLocaleString()}€</p>
              <p className="text-sm text-green-600 mt-1 animate-slide-in-left">
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +8.2% vs mois dernier
                </span>
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 animate-pulse-custom">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Info and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
        {/* Admin Info */}
        <div className="lg:col-span-1 animate-slide-in-left">
          <AdminInfo />
        </div>
        
        {/* Charts and Activities */}
        <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover-lift animate-slide-in-right">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 animate-fade-in">Activités Récentes</h3>
            <button className="text-[#007BFF] hover:text-blue-700 text-sm font-medium transition-all duration-300 hover:scale-105 animate-pulse">
              Voir tout
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 hover-lift stagger-item" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="w-8 h-8 bg-[#007BFF]/10 rounded-full flex items-center justify-center text-[#007BFF] hover:scale-110 transition-transform duration-300 animate-pulse-custom">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover-lift animate-slide-in-left">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 animate-fade-in">Prochains RDV</h3>
            <button className="text-[#007BFF] hover:text-blue-700 text-sm font-medium transition-all duration-300 hover:scale-105 animate-pulse">
              Planning
            </button>
          </div>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment, index) => (
              <div key={appointment.id} className="border-l-4 border-[#007BFF] pl-4 py-2 hover:bg-gray-50 rounded-r-lg transition-all duration-300 hover-lift stagger-item" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{appointment.patient}</p>
                  <span className="text-xs bg-[#007BFF]/10 text-[#007BFF] px-2 py-1 rounded-full hover:scale-105 transition-transform duration-200 animate-pulse-custom">
                    {appointment.time}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{appointment.doctor} • {appointment.type}</p>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover-lift animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 animate-slide-in-left">Actions Rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-[#007BFF] hover:bg-[#007BFF]/5 transition-all duration-300 group hover-lift stagger-item hover-glow">
            <div className="w-12 h-12 bg-[#007BFF]/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#007BFF]/20 transition-all duration-300 group-hover:scale-110 animate-pulse-custom">
              <svg className="w-6 h-6 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#007BFF] transition-colors duration-200">Nouveau Patient</span>
          </button>

          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-[#007BFF] hover:bg-[#007BFF]/5 transition-all duration-300 group hover-lift stagger-item hover-glow">
            <div className="w-12 h-12 bg-[#007BFF]/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#007BFF]/20 transition-all duration-300 group-hover:scale-110 animate-pulse-custom">
              <svg className="w-6 h-6 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#007BFF] transition-colors duration-200">Planifier RDV</span>
          </button>

          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-[#007BFF] hover:bg-[#007BFF]/5 transition-all duration-300 group hover-lift stagger-item hover-glow">
            <div className="w-12 h-12 bg-[#007BFF]/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#007BFF]/20 transition-all duration-300 group-hover:scale-110 animate-pulse-custom">
              <svg className="w-6 h-6 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#007BFF] transition-colors duration-200">Rapport</span>
          </button>

          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-[#007BFF] hover:bg-[#007BFF]/5 transition-all duration-300 group hover-lift stagger-item hover-glow">
            <div className="w-12 h-12 bg-[#007BFF]/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#007BFF]/20 transition-all duration-300 group-hover:scale-110 animate-pulse-custom">
              <svg className="w-6 h-6 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#007BFF] transition-colors duration-200">Paramètres</span>
          </button>
        </div>
      </div>
    </div>
  );
}
