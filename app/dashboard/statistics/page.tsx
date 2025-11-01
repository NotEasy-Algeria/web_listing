"use client";

import { useState, useEffect } from "react";
import { DatabaseService } from "../../../lib/database";

interface Doctor {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  field?: string;
  status?: boolean;
}

interface Abonnement {
  id: string;
  id_doctor: string;
  price: number;
  type: string;
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

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [doctorsData, abonnementsData] = await Promise.all([
          DatabaseService.getDoctors(),
          DatabaseService.getAbonnements(),
        ]);
        
        // Transform doctors data to match our interface
        const transformedDoctors = (doctorsData || []).map((doc: any) => ({
          id: doc.id,
          first_name: doc.first_name,
          last_name: doc.last_name,
          email: doc.email,
          field: doc.field,
          status: doc.status,
        }));
        
        setDoctors(transformedDoctors || []);
        setAbonnements(abonnementsData || []);
      } catch (e: any) {
        console.error('Error loading statistics data:', e);
        setError(e?.message || "Erreur de chargement des données");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calculate stats dynamically
  const today = new Date().toISOString().split('T')[0];
  const activeAbonnements = abonnements.filter(ab => ab.end_date >= today);
  const totalRevenue = abonnements.reduce((sum, ab) => sum + Number(ab.price || 0), 0);
  const activeRevenue = activeAbonnements.reduce((sum, ab) => sum + Number(ab.price || 0), 0);
  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter(doc => doc.status === true).length;
  
  // Calculate revenue by month from abonnements
  const getRevenueByMonth = () => {
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const revenueByMonth: { [key: string]: number } = {};
    
    abonnements.forEach(ab => {
      const date = new Date(ab.created_at);
      const monthKey = `${monthNames[date.getMonth()]}`;
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + Number(ab.price || 0);
    });
    
    // Get last 6 months
    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthNames[date.getMonth()];
      last6Months.push({
        month: monthKey,
        value: revenueByMonth[monthKey] || 0
      });
    }
    
    return last6Months;
  };

  // Calculate revenue by day of week (last 7 days)
  const getRevenueByDay = () => {
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const revenueByDay: { [key: string]: number } = {};
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    abonnements.forEach(ab => {
      const date = new Date(ab.created_at);
      if (date >= sevenDaysAgo) {
        const dayKey = dayNames[date.getDay()];
        revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + Number(ab.price || 0);
      }
    });
    
    return dayNames.map(day => ({
      day,
      value: revenueByDay[day] || 0
    }));
  };

  // Top doctors by revenue from abonnements
  const getTopDoctors = () => {
    const doctorRevenue: { [key: string]: { name: string; revenue: number; abonnements: number } } = {};
    
    abonnements.forEach(ab => {
      const doctorId = ab.id_doctor;
      const doctorName = ab.doctors 
        ? `${ab.doctors.first_name || ''} ${ab.doctors.last_name || ''}`.trim() || 'Docteur'
        : 'Docteur';
      
      if (!doctorRevenue[doctorId]) {
        doctorRevenue[doctorId] = {
          name: doctorName,
          revenue: 0,
          abonnements: 0
        };
      }
      
      doctorRevenue[doctorId].revenue += Number(ab.price || 0);
      doctorRevenue[doctorId].abonnements += 1;
    });
    
    return Object.values(doctorRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((doc, index) => ({
        name: `Dr. ${doc.name}`,
        patients: doc.abonnements,
        rating: 0, // Not available in current schema
        revenue: doc.revenue
      }));
  };

  // Recent abonnements as transactions
  const getRecentTransactions = () => {
    return abonnements
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((ab, index) => {
        const doctorName = ab.doctors 
          ? `${ab.doctors.first_name || ''} ${ab.doctors.last_name || ''}`.trim() || 'Docteur'
          : 'Docteur';
        const endDate = new Date(ab.end_date);
        const today = new Date();
        const status = endDate >= today ? "completed" : "expired";
        
        return {
          id: ab.id,
          patient: doctorName,
          amount: Number(ab.price || 0),
          date: new Date(ab.created_at).toISOString().split('T')[0],
          status
        };
      });
  };

  const chartData = {
    revenue: getRevenueByMonth(),
    appointments: getRevenueByDay()
  };

  const stats = {
    totalRevenue: totalRevenue, // Total of ALL abonnements, not just active ones
    totalPatients: activeDoctors,
    totalAppointments: activeAbonnements.length,
    averageRating: 0, // Not available in current schema
    growthRate: 0, // Can be calculated with historical data
    conversionRate: activeDoctors > 0 ? ((activeDoctors / totalDoctors) * 100).toFixed(1) : 0
  };

  const topDoctors = getTopDoctors();
  const recentTransactions = getRecentTransactions();

  // Calculate performance indicators dynamically
  const calculatePerformanceIndicators = () => {
    // 1. Average subscription duration (in days)
    const subscriptionDurations = abonnements.map(ab => {
      const start = new Date(ab.start);
      const end = new Date(ab.end_date);
      return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    });
    const avgDuration = subscriptionDurations.length > 0
      ? Math.round(subscriptionDurations.reduce((sum, d) => sum + d, 0) / subscriptionDurations.length)
      : 0;
    const avgDurationMonths = Math.round(avgDuration / 30);

    // 2. Active subscription rate (percentage of active vs total)
    const activeRate = abonnements.length > 0
      ? Math.round((activeAbonnements.length / abonnements.length) * 100)
      : 0;

    // 3. Renewal/Conversion rate (doctors with active subscriptions)
    const renewalRate = totalDoctors > 0
      ? Math.round((activeDoctors / totalDoctors) * 100)
      : 0;

    // 4. Average revenue per subscription
    const avgRevenuePerSubscription = abonnements.length > 0
      ? Math.round(totalRevenue / abonnements.length)
      : 0;

    return {
      avgDurationMonths,
      activeRate,
      renewalRate,
      avgRevenuePerSubscription
    };
  };

  const performanceIndicators = calculatePerformanceIndicators();

  // Export/Print function
  const handleExport = () => {
    // Create a comprehensive report
    const reportContent = `
╔════════════════════════════════════════════════════════════════╗
║                  RAPPORT DE STATISTIQUES                        ║
║                  Doctor App - Dashboard                         ║
╚════════════════════════════════════════════════════════════════╝

Date du rapport: ${new Date().toLocaleDateString('fr-FR', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

═══════════════════════════════════════════════════════════════════
📊 STATISTIQUES PRINCIPALES
═══════════════════════════════════════════════════════════════════

• Revenus Totaux: ${stats.totalRevenue.toLocaleString()} DA
• Total Docteurs: ${totalDoctors} (${activeDoctors} actifs)
• Abonnements Actifs: ${activeAbonnements.length} sur ${abonnements.length} au total
• Taux d'Activation: ${stats.conversionRate}%

═══════════════════════════════════════════════════════════════════
📈 INDICATEURS DE PERFORMANCE
═══════════════════════════════════════════════════════════════════

• Durée moyenne d'abonnement: ${performanceIndicators.avgDurationMonths} mois
• Taux d'abonnements actifs: ${performanceIndicators.activeRate}%
• Taux d'activation docteurs: ${performanceIndicators.renewalRate}%
• Revenu moyen par abonnement: ${performanceIndicators.avgRevenuePerSubscription.toLocaleString()} DA

═══════════════════════════════════════════════════════════════════
🏆 TOP 5 DOCTEURS PAR REVENUS
═══════════════════════════════════════════════════════════════════

${topDoctors.length > 0 ? topDoctors.map((doc, index) => 
  `${index + 1}. ${doc.name} - ${doc.revenue.toLocaleString()} DA (${doc.patients} abonnement${doc.patients > 1 ? 's' : ''})`
).join('\n') : 'Aucun docteur avec abonnements'}

═══════════════════════════════════════════════════════════════════
💰 REVENUS PAR MOIS (6 derniers mois)
═══════════════════════════════════════════════════════════════════

${chartData.revenue.map(item => `${item.month}: ${item.value.toLocaleString()} DA`).join('\n')}

═══════════════════════════════════════════════════════════════════
📅 TRANSACTIONS RÉCENTES
═══════════════════════════════════════════════════════════════════

${recentTransactions.length > 0 ? recentTransactions.map((trans, index) => 
  `${index + 1}. ${trans.patient} - ${trans.amount.toLocaleString()} DA - ${trans.date} - ${trans.status === 'completed' ? 'Actif' : trans.status === 'pending' ? 'En attente' : 'Expiré'}`
).join('\n') : 'Aucune transaction récente'}

═══════════════════════════════════════════════════════════════════
📋 DÉTAILS DES ABONNEMENTS
═══════════════════════════════════════════════════════════════════

Total d'abonnements: ${abonnements.length}
• Actifs: ${activeAbonnements.length}
• Expirés: ${abonnements.length - activeAbonnements.length}

═══════════════════════════════════════════════════════════════════
📊 DÉTAILS DES DOCTEURS
═══════════════════════════════════════════════════════════════════

Total docteurs: ${totalDoctors}
• Actifs (avec abonnement): ${activeDoctors}
• En attente (sans abonnement): ${totalDoctors - activeDoctors}

═══════════════════════════════════════════════════════════════════

Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
© Doctor App Dashboard
`;

    // Create blob and download
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-statistiques-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print function
  const handlePrint = () => {
    // Create a print-friendly version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Rapport Statistiques - Doctor App</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007BFF; padding-bottom: 10px; }
      .section { margin: 20px 0; page-break-inside: avoid; }
      .section h2 { color: #007BFF; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
      .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
      .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
      .stat-value { font-size: 24px; font-weight: bold; color: #007BFF; }
      .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #007BFF; color: white; }
      .indicators { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
      .indicator { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
      .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
    }
    body { font-family: Arial, sans-serif; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007BFF; padding-bottom: 10px; }
    .section { margin: 20px 0; }
    .section h2 { color: #007BFF; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
    .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #007BFF; }
    .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #007BFF; color: white; }
    .indicators { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
    .indicator { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Rapport de Statistiques</h1>
    <p>Doctor App - Dashboard</p>
    <p>Date: ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>

  <div class="section">
    <h2>📊 Statistiques Principales</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.totalRevenue.toLocaleString()} DA</div>
        <div class="stat-label">Revenus Totaux</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalDoctors}</div>
        <div class="stat-label">Total Docteurs (${activeDoctors} actifs)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${activeAbonnements.length}</div>
        <div class="stat-label">Abonnements Actifs sur ${abonnements.length}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>📈 Indicateurs de Performance</h2>
    <div class="indicators">
      <div class="indicator">
        <div class="stat-value">${performanceIndicators.avgDurationMonths}</div>
        <div class="stat-label">Durée moyenne (mois)</div>
      </div>
      <div class="indicator">
        <div class="stat-value">${performanceIndicators.activeRate}%</div>
        <div class="stat-label">Taux actifs</div>
      </div>
      <div class="indicator">
        <div class="stat-value">${performanceIndicators.renewalRate}%</div>
        <div class="stat-label">Taux activation</div>
      </div>
      <div class="indicator">
        <div class="stat-value">${performanceIndicators.avgRevenuePerSubscription.toLocaleString()}</div>
        <div class="stat-label">Moyenne/abonnement (DA)</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>🏆 Top 5 Docteurs par Revenus</h2>
    <table>
      <thead>
        <tr>
          <th>Rang</th>
          <th>Nom</th>
          <th>Revenus (DA)</th>
          <th>Abonnements</th>
        </tr>
      </thead>
      <tbody>
        ${topDoctors.length > 0 ? topDoctors.map((doc, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${doc.name}</td>
          <td>${doc.revenue.toLocaleString()} DA</td>
          <td>${doc.patients}</td>
        </tr>
        `).join('') : '<tr><td colspan="4" style="text-align: center;">Aucun docteur avec abonnements</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>💰 Revenus par Mois (6 derniers mois)</h2>
    <table>
      <thead>
        <tr>
          <th>Mois</th>
          <th>Revenus (DA)</th>
        </tr>
      </thead>
      <tbody>
        ${chartData.revenue.map(item => `
        <tr>
          <td>${item.month}</td>
          <td>${item.value.toLocaleString()} DA</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>📅 Transactions Récentes</h2>
    <table>
      <thead>
        <tr>
          <th>Docteur</th>
          <th>Montant (DA)</th>
          <th>Date</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        ${recentTransactions.length > 0 ? recentTransactions.map(trans => `
        <tr>
          <td>${trans.patient}</td>
          <td>${trans.amount.toLocaleString()} DA</td>
          <td>${trans.date}</td>
          <td>${trans.status === 'completed' ? 'Actif' : trans.status === 'pending' ? 'En attente' : 'Expiré'}</td>
        </tr>
        `).join('') : '<tr><td colspan="4" style="text-align: center;">Aucune transaction récente</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>📋 Résumé</h2>
    <table>
      <tr>
        <td><strong>Total Abonnements</strong></td>
        <td>${abonnements.length}</td>
      </tr>
      <tr>
        <td>Abonnements Actifs</td>
        <td>${activeAbonnements.length}</td>
      </tr>
      <tr>
        <td>Abonnements Expirés</td>
        <td>${abonnements.length - activeAbonnements.length}</td>
      </tr>
      <tr>
        <td><strong>Total Docteurs</strong></td>
        <td>${totalDoctors}</td>
      </tr>
      <tr>
        <td>Docteurs Actifs</td>
        <td>${activeDoctors}</td>
      </tr>
      <tr>
        <td>Docteurs en Attente</td>
        <td>${totalDoctors - activeDoctors}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <p>Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    <p>© Doctor App Dashboard - Tous droits réservés</p>
  </div>
</body>
</html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      // Optionally close after printing
      // printWindow.close();
    }, 250);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#007BFF] mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Erreur: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-600 mt-1">Analysez les performances de votre plateforme</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">3 derniers mois</option>
            <option value="1y">Cette année</option>
          </select> */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              title="Télécharger le rapport"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Télécharger</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-[#007BFF] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              title="Imprimer le rapport"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} DA</p>
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {abonnements.length} abonnements au total
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
              <p className="text-sm font-medium text-gray-600">Total Docteurs</p>
              <p className="text-3xl font-bold text-gray-900">{totalDoctors}</p>
              <p className="text-sm text-blue-600 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {activeDoctors} docteurs actifs
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
              <p className="text-sm font-medium text-gray-600">Taux d'Activation</p>
              <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
              <p className="text-sm text-orange-600 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Docteurs avec abonnements
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
              <span className="text-sm text-gray-600">Revenus mensuels (DA)</span>
            </div>
          </div>
          
          {chartData.revenue.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Aucune donnée disponible</p>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.revenue.map((item, index) => {
                const maxValue = Math.max(...chartData.revenue.map(d => d.value), 1);
                const height = (item.value / maxValue) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex justify-center mb-2">
                      <div 
                        className="w-8 bg-[#007BFF] rounded-t-lg transition-all duration-500 hover:bg-blue-600"
                        style={{ height: `${Math.max(height * 2, 10)}px` }}
                        title={`${item.value.toLocaleString()} DA`}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{item.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Appointments Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenus par Jour (7 derniers jours)</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Revenus (DA)</span>
            </div>
          </div>
          
          {chartData.appointments.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Aucune donnée disponible</p>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.appointments.map((item, index) => {
                const maxValue = Math.max(...chartData.appointments.map(d => d.value), 1);
                const height = (item.value / maxValue) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex justify-center mb-2">
                      <div 
                        className="w-8 bg-green-500 rounded-t-lg transition-all duration-500 hover:bg-green-600"
                        style={{ height: `${Math.max(height * 2, 10)}px` }}
                        title={`${item.value.toLocaleString()} DA`}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{item.day}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Doctors and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Doctors */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Docteurs</h3>
            {/* <button className="text-[#007BFF] hover:text-blue-700 text-sm font-medium">
              Voir tout
            </button> */}
          </div>
          
          <div className="space-y-4">
            {topDoctors.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucun docteur avec abonnements</p>
            ) : (
              topDoctors.map((doctor, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#007BFF] rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {doctor.name.split(' ')[1]?.[0] || doctor.name[0] || 'D'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doctor.name}</p>
                      <p className="text-xs text-gray-500">{doctor.patients} abonnement{doctor.patients > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{doctor.revenue.toLocaleString()} DA</p>
                    <p className="text-xs text-gray-500">Revenus total</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Transactions Récentes</h3>
            {/* <button className="text-[#007BFF] hover:text-blue-700 text-sm font-medium">
              Voir tout
            </button> */}
          </div>
          
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucune transaction récente</p>
            ) : (
              recentTransactions.map((transaction) => (
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
                    <p className="text-sm font-medium text-gray-900">{transaction.amount.toLocaleString()} DA</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.status === "completed" 
                        ? "bg-green-100 text-green-800"
                        : transaction.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {transaction.status === "completed" ? "Actif" : 
                       transaction.status === "pending" ? "En attente" : "Expiré"}
                    </span>
                  </div>
                </div>
              ))
            )}
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
            <p className="text-2xl font-bold text-gray-900">{performanceIndicators.avgDurationMonths} mois</p>
            <p className="text-sm text-gray-600">Durée moyenne d'abonnement</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">{performanceIndicators.activeRate}%</p>
            <p className="text-sm text-gray-600">Taux d'abonnements actifs</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">{performanceIndicators.renewalRate}%</p>
            <p className="text-sm text-gray-600">Taux d'activation docteurs</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">{performanceIndicators.avgRevenuePerSubscription.toLocaleString()} DA</p>
            <p className="text-sm text-gray-600">Revenu moyen par abonnement</p>
          </div>
        </div>
      </div>
    </div>
  );
}
