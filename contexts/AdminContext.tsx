"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthService, AdminUser } from "../lib/auth";

interface AdminContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  setAdmin: (admin: AdminUser | null) => void;
  refreshAdmin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load admin data on mount
  useEffect(() => {
    const loadAdmin = () => {
      try {
        const adminData = AuthService.getCurrentUser();
        setAdmin(adminData);
      } catch (error) {
        console.error("Error loading admin data:", error);
        setAdmin(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdmin();
  }, []);

  // Refresh admin data from Supabase
  const refreshAdmin = async () => {
    try {
      const currentAdmin = AuthService.getCurrentUser();
      if (currentAdmin && currentAdmin.id) {
        // Fetch fresh data from Supabase
        const updatedAdmin = await AuthService.getAdminProfile(currentAdmin.id);
        if (updatedAdmin) {
          // Update localStorage with fresh data
          AuthService.setCurrentUser(updatedAdmin);
          setAdmin(updatedAdmin);
        }
      } else {
        // Fallback to localStorage if no admin ID
        const adminData = AuthService.getCurrentUser();
        setAdmin(adminData);
      }
    } catch (error) {
      console.error("Error refreshing admin data:", error);
      // Fallback to localStorage on error
      const adminData = AuthService.getCurrentUser();
      setAdmin(adminData);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await AuthService.signOut();
      setAdmin(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const value: AdminContextType = {
    admin,
    isLoading,
    setAdmin,
    refreshAdmin,
    logout,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

// Custom hook to use admin context
export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
