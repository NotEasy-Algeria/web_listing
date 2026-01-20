"use client";

import { useState, useEffect } from "react";
import { DatabaseService } from "@/lib/database";
import { supabase } from "@/lib/supabase";

interface Doctor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  field: string | null;
  status: boolean;
  password?: string | null;
  created_at: string;
  updated_at: string;
}

export default function GestionDoctorPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Form state for creating new doctor
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    field: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Fields (fileds) state
  const [showAddFieldsModal, setShowAddFieldsModal] = useState(false);
  const [fieldsList, setFieldsList] = useState<string[]>([""]);
  const [creatingFields, setCreatingFields] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  
  // Existing fields management
  const [existingFields, setExistingFields] = useState<Array<{ id: string; name: string; created_at: string; updated_at: string }>>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [editingField, setEditingField] = useState<{ id: string; name: string } | null>(null);
  const [editFieldName, setEditFieldName] = useState("");
  const [deletingField, setDeletingField] = useState<{ id: string; name: string } | null>(null);
  const [updatingField, setUpdatingField] = useState(false);
  const [fieldsSectionOpen, setFieldsSectionOpen] = useState(true);

  // Load doctors from Supabase
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await DatabaseService.getDoctors();
        setDoctors(data || []);
      } catch (e: any) {
        console.error('Error loading doctors:', e);
        setError(e?.message || "Erreur de chargement des docteurs");
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  // Load existing fields from Supabase
  useEffect(() => {
    const loadFields = async () => {
      try {
        setLoadingFields(true);
        const data = await DatabaseService.getFileds();
        setExistingFields(data || []);
      } catch (e: any) {
        console.error('Error loading fields:', e);
      } finally {
        setLoadingFields(false);
      }
    };

    loadFields();
  }, []);

  const filteredDoctors = doctors.filter(doctor => {
    const fullName = `${doctor.first_name || ''} ${doctor.last_name || ''}`.toLowerCase();
    const matchesSearch = !searchTerm || 
                         fullName.includes(searchTerm.toLowerCase()) ||
                         (doctor.email && doctor.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (doctor.field && doctor.field.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || 
                         (statusFilter === "active" && doctor.status === true) ||
                         (statusFilter === "inactive" && doctor.status === false);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: boolean) => {
    return status ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";
  };

  const getStatusText = (status: boolean) => {
    return status ? "Actif" : "En attente";
  };

  // Check if email exists in Supabase
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const allDoctors = await DatabaseService.getDoctors();
      return allDoctors.some(doc => doc.email?.toLowerCase() === email.toLowerCase());
    } catch (e) {
      console.error('Error checking email:', e);
      return false;
    }
  };

  // Create new doctor
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreating(true);

    try {
      // Validate form
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
        setFormError("Veuillez remplir tous les champs obligatoires (Nom, Prénom, Email, Mot de passe)");
        setCreating(false);
        return;
      }

      // Validate password length
      if (formData.password.length < 6) {
        setFormError("Le mot de passe doit contenir au moins 6 caractères");
        setCreating(false);
        return;
      }

      // Check if email exists in doctors table
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        setFormError("Cet email est déjà utilisé par un autre docteur");
        setCreating(false);
        return;
      }

      // Step 1: Create user in Supabase Auth
      // This creates the authentication account and handles password securely
      // Supabase Auth will automatically send a confirmation email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: 'doctor'
          }
        }
      });

      if (authError) {
        // Check if user already exists in auth
        if (authError.message.includes('already registered')) {
          setFormError("Cet email est déjà enregistré dans le système d'authentification");
          setCreating(false);
          return;
        }
        throw new Error(`Erreur lors de la création du compte: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("Erreur: Aucun utilisateur créé dans Supabase Auth");
      }

      // Step 2: Create doctor record in database
      // Password is stored securely in Supabase Auth, not in the doctors table
      // The doctor can login using their email/password via Supabase Auth
      const newDoctor = await DatabaseService.createDoctor({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        field: formData.field || null,
        status: false, // Default to inactive/pending until subscription is created
      });

      // Note: Supabase Auth automatically sends confirmation email when signUp is called
      // The user will receive an email to confirm their email address

      // Save email for success message before resetting form
      const doctorEmail = formData.email;

      // Add to list and close modal
      setDoctors([newDoctor, ...doctors]);
      setShowAddModal(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        field: "",
        password: "",
      });
      setFormError(null);
      setShowPassword(false);
      
      // Show success modal
      setSuccessMessage(
        `Docteur créé avec succès ! Un compte Supabase Auth a été créé pour ${doctorEmail}. Un email de confirmation a été envoyé. Le docteur devra confirmer son email avant de pouvoir se connecter avec le mot de passe fourni.`
      );
      setShowSuccessModal(true);
    } catch (e: any) {
      console.error('Error creating doctor:', e);
      setFormError(e?.message || "Erreur lors de la création du docteur");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce docteur ? Cette action est irréversible.")) {
      try {
        await DatabaseService.deleteDoctor(id);
        setDoctors(doctors.filter(doctor => doctor.id !== id));
      } catch (e: any) {
        console.error('Error deleting doctor:', e);
        alert("Erreur lors de la suppression: " + (e?.message || "Erreur inconnue"));
      }
    }
  };

  // Handle adding new field input
  const handleAddFieldInput = () => {
    setFieldsList([...fieldsList, ""]);
  };

  // Handle removing field input
  const handleRemoveFieldInput = (index: number) => {
    if (fieldsList.length > 1) {
      const newList = fieldsList.filter((_, i) => i !== index);
      setFieldsList(newList);
    }
  };

  // Handle field input change
  const handleFieldInputChange = (index: number, value: string) => {
    const newList = [...fieldsList];
    newList[index] = value;
    setFieldsList(newList);
  };

  // Handle bulk create fields
  const handleCreateFields = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldsError(null);
    setCreatingFields(true);

    try {
      // Filter out empty fields and trim whitespace
      const fieldsToCreate = fieldsList
        .map(field => field.trim())
        .filter(field => field.length > 0);

      if (fieldsToCreate.length === 0) {
        setFieldsError("Veuillez saisir au moins un domaine");
        setCreatingFields(false);
        return;
      }

      // Create bulk insert array
      const fieldsData = fieldsToCreate.map(name => ({ name }));

      // Use bulk create function
      await DatabaseService.createFiledsBulk(fieldsData);

      // Reload fields
      const updatedFields = await DatabaseService.getFileds();
      setExistingFields(updatedFields || []);

      // Reset form
      setFieldsList([""]);
      setShowAddFieldsModal(false);
      setFieldsError(null);
      
      // Show success message
      alert(`${fieldsToCreate.length} domaine(s) ajouté(s) avec succès !`);
    } catch (e: any) {
      console.error('Error creating fields:', e);
      setFieldsError(e?.message || "Erreur lors de l'ajout des domaines");
    } finally {
      setCreatingFields(false);
    }
  };

  // Handle edit field
  const handleEditField = (field: { id: string; name: string }) => {
    setEditingField(field);
    setEditFieldName(field.name);
  };

  // Handle update field
  const handleUpdateField = async () => {
    if (!editingField || !editFieldName.trim()) {
      alert("Le nom du domaine ne peut pas être vide");
      return;
    }

    setUpdatingField(true);
    try {
      await DatabaseService.updateFiled(editingField.id, { name: editFieldName.trim() });
      
      // Reload fields
      const updatedFields = await DatabaseService.getFileds();
      setExistingFields(updatedFields || []);
      
      setEditingField(null);
      setEditFieldName("");
      alert("Domaine mis à jour avec succès !");
    } catch (e: any) {
      console.error('Error updating field:', e);
      alert(e?.message || "Erreur lors de la mise à jour du domaine");
    } finally {
      setUpdatingField(false);
    }
  };

  // Handle delete field
  const handleDeleteField = async () => {
    if (!deletingField) return;

    try {
      await DatabaseService.deleteFiled(deletingField.id);
      
      // Reload fields
      const updatedFields = await DatabaseService.getFileds();
      setExistingFields(updatedFields || []);
      
      setDeletingField(null);
      alert("Domaine supprimé avec succès !");
    } catch (e: any) {
      console.error('Error deleting field:', e);
      alert(e?.message || "Erreur lors de la suppression du domaine");
    }
  };

  // Export doctors to file (CSV/TXT)
  const handleExportDoctors = () => {
    setShowExportMenu(false);
    
    const reportContent = `
╔════════════════════════════════════════════════════════════════╗
║                  LISTE DES DOCTEURS                              ║
╚════════════════════════════════════════════════════════════════╝

Date du rapport: ${new Date().toLocaleDateString('fr-FR', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

═══════════════════════════════════════════════════════════════════
📊 RÉSUMÉ
═══════════════════════════════════════════════════════════════════

• Total Docteurs: ${totalDoctors}
• Docteurs Actifs: ${activeDoctors}
• Docteurs en Attente: ${pendingDoctors}

═══════════════════════════════════════════════════════════════════
👨‍⚕️ LISTE DES DOCTEURS
═══════════════════════════════════════════════════════════════════

${filteredDoctors.length === 0 ? 'Aucun docteur trouvé' : filteredDoctors.map((doctor, index) => {
  const fullName = `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || 'Sans nom';
  const status = doctor.status ? 'Actif' : 'En attente';
  const createdAt = new Date(doctor.created_at).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `
${index + 1}. ${fullName}
   Email: ${doctor.email || 'N/A'}
   Téléphone: ${doctor.phone || 'N/A'}
   Domaine: ${doctor.field || 'Non spécifié'}
   Statut: ${status}
   Date d'inscription: ${createdAt}
`;
}).join('\n')}

═══════════════════════════════════════════════════════════════════

Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
`;

    // Create blob and download
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `liste-docteurs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print doctors list
  const handlePrintDoctors = () => {
    setShowExportMenu(false);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Liste des Docteurs - Doctor App</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007BFF; padding-bottom: 10px; }
      .section { margin: 20px 0; page-break-inside: avoid; }
      .section h2 { color: #007BFF; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #007BFF; color: white; }
      .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
    }
    body { font-family: Arial, sans-serif; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007BFF; padding-bottom: 10px; }
    .section { margin: 20px 0; }
    .section h2 { color: #007BFF; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #007BFF; color: white; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Liste des Docteurs</h1>
    <p>Date: ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>

  <div class="section">
    <h2>📊 Résumé</h2>
    <table>
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
        <td>${pendingDoctors}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>👨‍⚕️ Liste des Docteurs</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Nom complet</th>
          <th>Email</th>
          <th>Téléphone</th>
          <th>Domaine</th>
          <th>Statut</th>
          <th>Date d'inscription</th>
        </tr>
      </thead>
      <tbody>
        ${filteredDoctors.length === 0 ? '<tr><td colspan="7" style="text-align: center;">Aucun docteur trouvé</td></tr>' : filteredDoctors.map((doctor, index) => {
          const fullName = `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || 'Sans nom';
          const status = doctor.status ? 'Actif' : 'En attente';
          const createdAt = new Date(doctor.created_at).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          return `
        <tr>
          <td>${index + 1}</td>
          <td>${fullName}</td>
          <td>${doctor.email || 'N/A'}</td>
          <td>${doctor.phone || 'N/A'}</td>
          <td>${doctor.field || 'Non spécifié'}</td>
          <td>${status}</td>
          <td>${createdAt}</td>
        </tr>
        `;
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
  </div>
</body>
</html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };


  // Calculate dynamic stats
  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter(doctor => doctor.status === true).length;
  const pendingDoctors = doctors.filter(doctor => doctor.status === false).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Docteurs</h1>
          <p className="text-gray-600 mt-1">Gérez les comptes docteurs et leurs informations professionnelles</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#007BFF] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nouveau Docteur</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Docteurs</p>
              <p className="text-2xl font-bold text-gray-900">{totalDoctors}</p>
            </div>
            <div className="w-12 h-12 bg-[#007BFF]/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Docteurs Actifs</p>
              <p className="text-2xl font-bold text-green-600">{activeDoctors}</p>
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
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingDoctors}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Fields Management Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Section Header with Toggle */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setFieldsSectionOpen(!fieldsSectionOpen)}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                title={fieldsSectionOpen ? "Réduire" : "Développer"}
              >
                <svg 
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${fieldsSectionOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Gestion des Domaines Médicaux</h2>
                <p className="text-sm text-gray-600 mt-0.5">Gérez les domaines médicaux disponibles pour les docteurs</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddFieldsModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Ajouter Domaines</span>
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {fieldsSectionOpen && (
          <div className="p-6">
            {loadingFields ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007BFF]"></div>
              </div>
            ) : existingFields.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Aucun domaine trouvé</p>
                <p className="text-sm text-gray-400 mt-1">Cliquez sur "Ajouter Domaines" pour créer votre premier domaine</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {existingFields.map((field) => (
                  <div
                    key={field.id}
                    className="group relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border border-gray-200 hover:border-[#007BFF]/30 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-10 h-10 bg-[#007BFF]/10 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-lg">{field.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500">
                          Créé le {new Date(field.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleEditField(field)}
                        className="flex-1 px-3 py-2 bg-[#007BFF] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => setDeletingField(field)}
                        className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher un docteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center space-x-4">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">En attente</option>
            </select>

            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Exporter</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Export Menu Dropdown */}
              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-[9997]" 
                    onClick={() => setShowExportMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9998]">
                    <button
                      onClick={handleExportDoctors}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    >
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-gray-700">Télécharger</span>
                    </button>
                    <button
                      onClick={handlePrintDoctors}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-2 transition-colors border-t border-gray-200"
                    >
                      <svg className="w-5 h-5 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span className="text-gray-700">Imprimer</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#007BFF] mb-4"></div>
            <p className="text-gray-600">Chargement des docteurs...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Doctors Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Docteur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domaine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date d'inscription
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucun docteur trouvé
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doctor) => {
                    const firstName = doctor.first_name || '';
                    const lastName = doctor.last_name || '';
                    const fullName = `${firstName} ${lastName}`.trim() || 'Sans nom';
                    const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'DN';
                    
                    return (
                      <tr key={doctor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-[#007BFF] rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {initials}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{fullName}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(doctor.created_at).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {doctor.field || 'Non spécifié'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doctor.email || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{doctor.phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doctor.status)}`}>
                            {getStatusText(doctor.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(doctor.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteDoctor(doctor.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Supprimer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 opacity-75 z-[9998]" onClick={() => setShowAddModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-[9999]">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Nouveau Docteur</h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({ first_name: "", last_name: "", email: "", phone: "", field: "", password: "" });
                      setFormError(null);
                      setShowPassword(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {formError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{formError}</p>
                  </div>
                )}

                <form onSubmit={handleCreateDoctor} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                      placeholder="Prénom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                      placeholder="Nom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                      placeholder="email@doctorapp.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Domaine</label>
                    <select 
                      value={formData.field}
                      onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                    >
                      <option value="">Sélectionner un domaine</option>
                      {existingFields.map((field) => (
                        <option key={field.id} value={field.name}>
                          {field.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                        placeholder="Mot de passe (min. 6 caractères)"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Le mot de passe doit contenir au moins 6 caractères</p>
                  </div>
                </form>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCreateDoctor}
                  disabled={creating}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-[#007BFF] text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007BFF] disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {creating ? "Création..." : "Créer"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ first_name: "", last_name: "", email: "", phone: "", field: "", password: "" });
                    setFormError(null);
                    setShowPassword(false);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 opacity-75 z-[9998]" onClick={() => setShowSuccessModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-[9999]">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
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
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Docteur créé avec succès !</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {successMessage}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-[#007BFF] text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007BFF] sm:ml-3 sm:w-auto sm:text-sm"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Fields Modal */}
      {showAddFieldsModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 opacity-75 z-[9998]" onClick={() => {
              setShowAddFieldsModal(false);
              setFieldsList([""]);
              setFieldsError(null);
            }}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-[9999]">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Ajouter des Domaines</h3>
                  <button
                    onClick={() => {
                      setShowAddFieldsModal(false);
                      setFieldsList([""]);
                      setFieldsError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {fieldsError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{fieldsError}</p>
                  </div>
                )}

                <form onSubmit={handleCreateFields} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Domaines médicaux <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Vous pouvez ajouter plusieurs domaines à la fois. Cliquez sur "+" pour ajouter un autre champ.
                    </p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {fieldsList.map((field, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={field}
                            onChange={(e) => handleFieldInputChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                            placeholder={`Domaine ${index + 1} (ex: Cardiologie)`}
                          />
                          {fieldsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFieldInput(index)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer ce champ"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFieldInput}
                      className="mt-2 flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium text-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Ajouter un autre domaine</span>
                    </button>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCreateFields}
                  disabled={creatingFields || fieldsList.every(f => !f.trim())}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {creatingFields ? "Ajout..." : `Ajouter ${fieldsList.filter(f => f.trim()).length} domaine(s)`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFieldsModal(false);
                    setFieldsList([""]);
                    setFieldsError(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Field Modal */}
      {editingField && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 opacity-75 z-[9998]" onClick={() => {
              setEditingField(null);
              setEditFieldName("");
            }}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-[9999]">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Modifier le Domaine</h3>
                  <button
                    onClick={() => {
                      setEditingField(null);
                      setEditFieldName("");
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du domaine <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFieldName}
                      onChange={(e) => setEditFieldName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                      placeholder="Ex: Cardiologie"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleUpdateField}
                  disabled={updatingField || !editFieldName.trim()}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-[#007BFF] text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007BFF] disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {updatingField ? "Mise à jour..." : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingField(null);
                    setEditFieldName("");
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Field Confirmation Modal */}
      {deletingField && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 opacity-75 z-[9998]" onClick={() => setDeletingField(null)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-[9999]">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Confirmer la suppression</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Êtes-vous sûr de vouloir supprimer le domaine <span className="font-medium">"{deletingField.name}"</span> ? 
                      Cette action est irréversible.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteField}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingField(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
