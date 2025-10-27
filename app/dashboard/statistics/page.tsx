"use client";

import { useState } from "react";

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState("7d");

  const stats = {
    totalRevenue: 45680,
    totalPatients: 1247,
    totalAppointments: 324,
    averageRating: 4.8,
    growthRate: 12.5,
    conversionRate: 8.3
  };

  const chartData = {
    revenue: [
      { month: "Jan", value: 3200 },
      { month: "Fév", value: 3800 },
      { month: "Mar", value: 4200 },
      { month: "Avr", value: 3900 },
      { month: "Mai", value: 4500 },
      { month: "Jun", value: 5200 }
    ],
    appointments: [
      { day: "Lun", value: 12 },
      { day: "Mar", value: 18 },
      { day: "Mer", value: 15 },
      { day: "Jeu", value: 22 },
      { day: "Ven", value: 19 },
      { day: "Sam", value: 8 },
      { day: "Dim", value: 5 }
    ]
  };

  const topDoctors = [
    { name: "Dr. Martin", patients: 156, rating: 4.9, revenue: 12500 },
    { name: "Dr. Sophie", patients: 142, rating: 4.8, revenue: 11800 },
    { name: "Dr. Laurent", patients: 128, rating: 4.7, revenue: 10200 },
    { name: "Dr. Marie", patients: 115, rating: 4.6, revenue: 9800 },
    { name: "Dr. Pierre", patients: 98, rating: 4.5, revenue: 8500 }
  ];

  const recentTransactions = [
    { id: 1, patient: "Marie Dupont", amount: 150, date: "2024-01-15", status: "completed" },
    { id: 2, patient: "Jean Martin", amount: 120, date: "2024-01-15", status: "completed" },
    { id: 3, patient: "Sophie Bernard", amount: 200, date: "2024-01-14", status: "pending" },
    { id: 4, patient: "Pierre Dubois", amount: 180, date: "2024-01-14", status: "completed" },
    { id: 5, patient: "Alice Moreau", amount: 90, date: "2024-01-13", status: "failed" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-600 mt-1">Analysez les performances de votre plateforme</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">3 derniers mois</option>
            <option value="1y">Cette année</option>
          </select>
          <button className="bg-[#007BFF] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()}€</p>
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +{stats.growthRate}% vs mois dernier
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Patients Actifs</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPatients.toLocaleString()}</p>
              <p className="text-sm text-blue-600 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +156 nouveaux ce mois
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de Conversion</p>
              <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
              <p className="text-sm text-orange-600 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                +2.1% vs mois dernier
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Évolution des Revenus</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#007BFF] rounded-full"></div>
              <span className="text-sm text-gray-600">Revenus mensuels</span>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between space-x-2">
            {chartData.revenue.map((item, index) => {
              const height = (item.value / Math.max(...chartData.revenue.map(d => d.value))) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex justify-center mb-2">
                    <div 
                      className="w-8 bg-[#007BFF] rounded-t-lg transition-all duration-500 hover:bg-blue-600"
                      style={{ height: `${height * 2}px` }}
                      title={`${item.value}€`}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointments Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Rendez-vous par Jour</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Cette semaine</span>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between space-x-2">
            {chartData.appointments.map((item, index) => {
              const height = (item.value / Math.max(...chartData.appointments.map(d => d.value))) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex justify-center mb-2">
                    <div 
                      className="w-8 bg-green-500 rounded-t-lg transition-all duration-500 hover:bg-green-600"
                      style={{ height: `${height * 2}px` }}
                      title={`${item.value} RDV`}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Doctors and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Doctors */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Docteurs</h3>
            <button className="text-[#007BFF] hover:text-blue-700 text-sm font-medium">
              Voir tout
            </button>
          </div>
          
          <div className="space-y-4">
            {topDoctors.map((doctor, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#007BFF] rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {doctor.name.split(' ')[1][0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doctor.name}</p>
                    <p className="text-xs text-gray-500">{doctor.patients} patients</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{doctor.revenue.toLocaleString()}€</p>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="text-xs text-gray-500">{doctor.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Transactions Récentes</h3>
            <button className="text-[#007BFF] hover:text-blue-700 text-sm font-medium">
              Voir tout
            </button>
          </div>
          
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.patient}</p>
                    <p className="text-xs text-gray-500">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{transaction.amount}€</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    transaction.status === "completed" 
                      ? "bg-green-100 text-green-800"
                      : transaction.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {transaction.status === "completed" ? "Payé" : 
                     transaction.status === "pending" ? "En attente" : "Échoué"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Indicateurs de Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#007BFF]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">18 min</p>
            <p className="text-sm text-gray-600">Temps moyen de consultation</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">94%</p>
            <p className="text-sm text-gray-600">Taux de satisfaction</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">12%</p>
            <p className="text-sm text-gray-600">Taux de retour</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">€156</p>
            <p className="text-sm text-gray-600">Revenus par patient</p>
          </div>
        </div>
      </div>
    </div>
  );
}
