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
      .select(`
        *,
        users!inner(name, email)
      `)
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
}
