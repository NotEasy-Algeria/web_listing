import { supabase } from './supabase'

export interface AdminUser {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  created_at: string
  updated_at: string
}

export class AuthService {
  // Sign in with email and password (checking admins table)
  static async signIn(email: string, password: string) {
    // Check if admin exists with this email
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) {
      throw new Error('Email ou mot de passe incorrect')
    }
    
    if (!admin) {
      throw new Error('Email ou mot de passe incorrect')
    }
    
    // Check password (in production, you should hash passwords)
    if (admin.password !== password) {
      throw new Error('Email ou mot de passe incorrect')
    }
    
    // Return admin data without password
    const { password: _, ...adminWithoutPassword } = admin
    return { user: adminWithoutPassword }
  }

  // Sign out (clear local storage)
  static async signOut() {
    // Clear admin data from localStorage
    localStorage.removeItem('admin_user')
    return true
  }

  // Get current admin user from localStorage
  static getCurrentUser(): AdminUser | null {
    if (typeof window === 'undefined') return null
    
    const adminData = localStorage.getItem('admin_user')
    if (!adminData) return null
    
    try {
      return JSON.parse(adminData)
    } catch {
      return null
    }
  }

  // Store admin user in localStorage
  static setCurrentUser(admin: AdminUser) {
    if (typeof window === 'undefined') return
    
    localStorage.setItem('admin_user', JSON.stringify(admin))
  }

  // Get admin profile data
  static async getAdminProfile(adminId: string): Promise<AdminUser | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('id, first_name, last_name, email, phone, created_at, updated_at')
      .eq('id', adminId)
      .single()
    
    if (error) throw error
    return data
  }

  // Update admin profile
  static async updateAdminProfile(adminId: string, updates: Partial<AdminUser> & { password?: string }) {
    const { data, error } = await supabase
      .from('admins')
      .update(updates)
      .eq('id', adminId)
      .select('id, first_name, last_name, email, phone, created_at, updated_at')
      .single()
    
    if (error) throw error
    return data
  }
}
