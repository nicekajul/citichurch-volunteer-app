"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export type UserRole = "admin" | "leader" | "volunteer"

interface Profile {
  id: string
  email: string
  name: string
  role: UserRole
  team_id: string | null
  avatar_url: string | null
  phone: string | null
  join_date: string
  status: string
}

interface User extends Profile {
  supabase_user: SupabaseUser
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isLoading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("[v0] Error fetching profile:", error)
      return null
    }

    return data as Profile
  }

  const refreshProfile = async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    if (supabaseUser) {
      const profileData = await fetchProfile(supabaseUser.id)
      if (profileData) {
        setProfile(profileData)
        setUser({ ...profileData, supabase_user: supabaseUser })
      }
    }
  }

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        if (profileData) {
          setProfile(profileData)
          setUser({ ...profileData, supabase_user: session.user })
        }
      }
      setIsLoading(false)
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event)
      
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        if (profileData) {
          setProfile(profileData)
          setUser({ ...profileData, supabase_user: session.user })
        }
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        const profileData = await fetchProfile(data.user.id)
        if (profileData) {
          setProfile(profileData)
          setUser({ ...profileData, supabase_user: data.user })
          return { success: true }
        }
      }

      return { success: false, error: "Profile not found" }
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const signup = async (
    email: string, 
    password: string, 
    name: string, 
    role: UserRole = "volunteer"
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, login, signup, logout, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin"
    case "leader":
      return "/dashboard/leader"
    case "volunteer":
      return "/dashboard/volunteer"
    default:
      return "/login"
  }
}
