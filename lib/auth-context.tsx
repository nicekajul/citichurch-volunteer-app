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
  // Prevent concurrent profile fetches
  const isFetchingRef = { current: false }

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) return null
      return data as Profile
    } catch {
      return null
    }
  }

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const profileData = await fetchProfile(session.user.id)
      if (profileData) {
        setProfile(profileData)
        setUser({ ...profileData, supabase_user: session.user })
      }
    }
  }

  useEffect(() => {
    const supabaseInstance = createClient()

    // Set up auth state listener FIRST before checking session
    const { data: { subscription } } = supabaseInstance.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setIsLoading(false)
        return
      }

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        // Guard against concurrent fetches
        if (isFetchingRef.current) return
        isFetchingRef.current = true
        try {
          const profileData = await fetchProfile(session.user.id)
          if (profileData) {
            setProfile(profileData)
            setUser({ ...profileData, supabase_user: session.user })
          }
        } finally {
          isFetchingRef.current = false
          setIsLoading(false)
        }
        return
      }

      // TOKEN_REFRESHED and other events - don't re-fetch profile
      if (event === 'TOKEN_REFRESHED') return

      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
