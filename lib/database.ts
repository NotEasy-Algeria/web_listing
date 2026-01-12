import { supabase } from './supabase'
import { Database } from './supabase'

type Tables = Database['public']['Tables']

export class DatabaseService {
  // Note: Users table not implemented in database schema
  // These functions are kept for future use but will fail if called
  // static async getUsers() { ... }
  // static async createUser() { ... }
  // static async updateUser() { ... }
  // static async deleteUser() { ... }

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

  // Note: Subscriptions functions removed - use getAbonnements, createAbonnement, etc. instead

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

  // Note: Appointments table not implemented in database schema
  // These functions are kept for future use but will fail if called
  // static async getAppointments() { ... }
  // static async createAppointment() { ... }
  // static async updateAppointment() { ... }

  // Statistics
  static async getDashboardStats() {
    const [doctorsResult, abonnementsResult] = await Promise.all([
      supabase.from('doctors').select('id', { count: 'exact' }),
      supabase.from('abonnements').select('price')
    ])

    // Calculate total revenue from all abonnements (or only active ones if end_date is in future)
    const today = new Date().toISOString().split('T')[0]
    const totalRevenue = abonnementsResult.data?.reduce((sum, ab) => sum + Number(ab.price), 0) || 0

    return {
      totalDoctors: doctorsResult.count || 0,
      totalAppointments: 0, // Not implemented yet
      totalRevenue
    }
  }

  // Recent Activities (combined feed)
  static async getRecentActivities(limit: number = 10) {
    try {
      // Fetch doctors
      const doctorsResult = await supabase
        .from('doctors')
        .select('id, first_name, last_name, field, status, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(limit)

      // Fetch abonnements separately (without join to avoid relation issues)
      const abonnementsResult = await supabase
        .from('abonnements')
        .select('id, type, price, start, end_date, created_at, id_doctor')
        .order('created_at', { ascending: false })
        .limit(limit)

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
      } else if (abonnementsResult.data && abonnementsResult.data.length > 0) {
        // Fetch doctors for abonnements separately
        const doctorIds = [...new Set(abonnementsResult.data.map((a: any) => a.id_doctor).filter(Boolean))]
        
        let doctorsMap = new Map()
        if (doctorIds.length > 0) {
          const { data: doctorsData, error: doctorsError } = await supabase
            .from('doctors')
            .select('id, first_name, last_name')
            .in('id', doctorIds)
          
          if (!doctorsError && doctorsData) {
            doctorsMap = new Map(doctorsData.map((doc: any) => [doc.id, doc]))
          }
        }
        
        abonnementsResult.data.forEach((a: any) => {
          const doctor = doctorsMap.get(a.id_doctor)
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

  static async createAbonnement(input: { id_doctor: string; price: number; type: string; start: string; end_date: string; count?: number }) {
    const { data, error } = await supabase
      .from('abonnements')
      .insert({
        id_doctor: input.id_doctor,
        price: input.price,
        type: input.type,
        start: input.start,
        end_date: input.end_date,
        count: input.count || 1
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

  // Sub_type Management
  static async getSubTypes() {
    const { data, error } = await supabase
      .from('sub_type')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async createSubType(subType: Tables['sub_type']['Insert']) {
    const { data, error } = await supabase
      .from('sub_type')
      .insert(subType)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateSubType(id: string, updates: Tables['sub_type']['Update']) {
    const { data, error } = await supabase
      .from('sub_type')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteSubType(id: string) {
    const { error } = await supabase
      .from('sub_type')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Fileds Management
  static async getFileds() {
    const { data, error } = await supabase
      .from('fileds')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async createFiled(filed: Tables['fileds']['Insert']) {
    const { data, error } = await supabase
      .from('fileds')
      .insert(filed)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async createFiledsBulk(fileds: Tables['fileds']['Insert'][]) {
    const { data, error } = await supabase
      .from('fileds')
      .insert(fileds)
      .select()
    
    if (error) throw error
    return data || []
  }

  static async updateFiled(id: string, updates: Tables['fileds']['Update']) {
    const { data, error } = await supabase
      .from('fileds')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteFiled(id: string) {
    const { error } = await supabase
      .from('fileds')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Events Management
  static async getEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  // Event Registrations Management
  static async getEventRegistrations(eventId: string) {
    // Fetch registrations with doctor information
    const { data: registrationsData, error: registrationsError } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('id_event', eventId)
      .order('created_at', { ascending: false })
    
    if (registrationsError) throw registrationsError
    
    if (!registrationsData || registrationsData.length === 0) {
      return []
    }
    
    // Fetch doctors for all registrations
    const doctorIds = [...new Set(registrationsData.map(reg => reg.id_doctor).filter(Boolean))]
    
    if (doctorIds.length === 0) {
      return registrationsData.map(reg => ({ ...reg, doctors: null }))
    }
    
    const { data: doctorsData, error: doctorsError } = await supabase
      .from('doctors')
      .select('id, first_name, last_name, email, phone')
      .in('id', doctorIds)
    
    if (doctorsError) {
      console.warn('Error fetching doctors:', doctorsError)
    }
    
    // Map doctors to registrations
    const doctorsMap = new Map((doctorsData || []).map(doc => [doc.id, doc]))
    
    return registrationsData.map(reg => ({
      ...reg,
      doctors: doctorsMap.get(reg.id_doctor) || null
    }))
  }
}
