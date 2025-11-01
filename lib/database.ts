import { supabase } from './supabase'
import { Database } from './supabase'

type Tables = Database['public']['Tables']

export class DatabaseService {
  // Users Management
  static async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createUser(user: Tables['users']['Insert']) {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateUser(id: string, updates: Tables['users']['Update']) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Doctors Management
  static async getDoctors() {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createDoctor(doctor: Tables['doctors']['Insert']) {
    const { data, error } = await supabase
      .from('doctors')
      .insert(doctor)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateDoctor(id: string, updates: Tables['doctors']['Update']) {
    const { data, error } = await supabase
      .from('doctors')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteDoctor(id: string) {
    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Subscriptions Management
  static async getSubscriptions() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        users!inner(name, email)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createSubscription(subscription: Tables['subscriptions']['Insert']) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateSubscription(id: string, updates: Tables['subscriptions']['Update']) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Admins Management
  static async getAdmins() {
    const { data, error } = await supabase
      .from('admins')
      .select('id, first_name, last_name, email, phone, status, created_at, updated_at')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createAdmin(admin: { first_name: string; last_name: string; email: string; password: string; phone?: string }) {
    const { data, error } = await supabase
      .from('admins')
      .insert(admin)
      .select('id, first_name, last_name, email, phone, created_at, updated_at')
      .single()
    
    if (error) throw error
    return data
  }

  static async updateAdmin(id: string, updates: Partial<{ first_name: string; last_name: string; email: string; phone: string; password: string; status: boolean }>) {
    const { data, error } = await supabase
      .from('admins')
      .update(updates)
      .eq('id', id)
      .select('id, first_name, last_name, email, phone, status, created_at, updated_at')
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteAdmin(id: string) {
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Appointments Management
  static async getAppointments() {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        users!appointments_patient_id_fkey(name, email),
        doctors!inner(
          *,
          users!inner(name, email)
        )
      `)
      .order('appointment_date', { ascending: true })
    
    if (error) throw error
    return data
  }

  static async createAppointment(appointment: Tables['appointments']['Insert']) {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateAppointment(id: string, updates: Tables['appointments']['Update']) {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Statistics
  static async getDashboardStats() {
    const [usersResult, doctorsResult, appointmentsResult, subscriptionsResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('doctors').select('id', { count: 'exact' }),
      supabase.from('appointments').select('id', { count: 'exact' }),
      supabase.from('subscriptions').select('price').eq('status', 'active')
    ])

    const totalRevenue = subscriptionsResult.data?.reduce((sum, sub) => sum + sub.price, 0) || 0

    return {
      totalUsers: usersResult.count || 0,
      totalDoctors: doctorsResult.count || 0,
      totalAppointments: appointmentsResult.count || 0,
      totalRevenue
    }
  }

  // Recent Activities (combined feed)
  static async getRecentActivities(limit: number = 10) {
    try {
      // Fetch doctors and abonnements
      const [doctorsResult, abonnementsResult] = await Promise.all([
        supabase
          .from('doctors')
          .select('id, first_name, last_name, field, status, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('abonnements')
          .select('id, type, price, start_date, end_date, created_at, doctors(id, first_name, last_name)')
          .order('created_at', { ascending: false })
          .limit(limit)
      ])

      const activities: Array<{ id: string; type: string; message: string; created_at: string }> = []

      // Handle doctors results
      if (doctorsResult.error) {
        console.error('Error fetching doctors for activities:', doctorsResult.error)
      } else if (doctorsResult.data) {
        doctorsResult.data.forEach((d: any) => {
          const doctorName = d.first_name && d.last_name 
            ? `${d.first_name} ${d.last_name}` 
            : d.first_name || d.last_name || 'Docteur'
          
          // Show new doctors
          activities.push({
            id: `doctor-${d.id}`,
            type: 'doctor',
            message: `Nouveau docteur: ${doctorName}${d.field ? ` (${d.field})` : ''}`,
            created_at: d.created_at,
          })
        })
      }

      // Handle abonnements results
      if (abonnementsResult.error) {
        console.error('Error fetching abonnements for activities:', abonnementsResult.error)
      } else if (abonnementsResult.data) {
        abonnementsResult.data.forEach((a: any) => {
          const doctor = a.doctors
          const doctorName = doctor && (doctor.first_name || doctor.last_name)
            ? `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim()
            : 'Un docteur'
          
          const planType = a.type === 'mensuel' ? 'Mensuel' : a.type === 'trimestriel' ? 'Trimestriel' : a.type === 'annuel' ? 'Annuel' : a.type || 'Abonnement'
          
          activities.push({
            id: `abonnement-${a.id}`,
            type: 'subscription',
            message: `Nouvel abonnement ${planType} pour ${doctorName} (${a.price} da)`,
            created_at: a.created_at,
          })
        })
      }

      // Sort by date (most recent first)
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      return activities.slice(0, limit)
    } catch (error) {
      console.error('Error fetching recent activities:', error)
      return []
    }
  }

  // Doctors with status = false (pending/non-active)
  static async getPendingDoctors() {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('status', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Abonnements (French subscriptions) CRUD
  static async getAbonnements() {
    // Fetch abonnements first
    const { data: abosData, error: abosError } = await supabase
      .from('abonnements')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (abosError) {
      console.error('Error fetching abonnements:', abosError)
      throw abosError
    }
    
    if (!abosData || abosData.length === 0) {
      return []
    }
    
    // Fetch doctors separately for all abonnements
    const doctorIds = [...new Set(abosData.map(ab => ab.id_doctor).filter(Boolean))]
    
    if (doctorIds.length === 0) {
      return abosData.map(ab => ({ ...ab, doctors: null }))
    }
    
    const { data: doctorsData, error: doctorsError } = await supabase
      .from('doctors')
      .select('id, first_name, last_name, email')
      .in('id', doctorIds)
    
    if (doctorsError) {
      console.warn('Error fetching doctors:', doctorsError)
    }
    
    // Map doctors to abonnements
    const doctorsMap = new Map((doctorsData || []).map(doc => [doc.id, doc]))
    
    return abosData.map(ab => ({
      ...ab,
      doctors: doctorsMap.get(ab.id_doctor) || null
    }))
  }

  static async createAbonnement(input: { id_doctor: string; price: number; type: string; start: string; end_date: string }) {
    const { data, error } = await supabase
      .from('abonnements')
      .insert({
        id_doctor: input.id_doctor,
        price: input.price,
        type: input.type,
        start: input.start,
        end_date: input.end_date
      })
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  static async updateAbonnement(id: string, updates: { type?: string; price?: number; start?: string; end_date?: string }) {
    const { data, error } = await supabase
      .from('abonnements')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteAbonnement(id: string) {
    const { error } = await supabase
      .from('abonnements')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
