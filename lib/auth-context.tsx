"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser, AuthChangeEvent, Session } from "@supabase/supabase-js"

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
  signup: (
    email: string,
    password: string,
    name: string,
    role?: UserRole
  ) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>
  resendConfirmation: (email: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isLoading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // createClient() returns the same singleton so session is shared across providers
  const supabase = createClient()
  const isFetchingRef = useRef(false)

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
    // Directly resolve the current session — this is the reliable path on refresh.
    // onAuthStateChange's INITIAL_SESSION can be missed in some React Strict Mode
    // or timing edge cases, so getSession() acts as the guaranteed fallback.
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        if (profileData) {
          setProfile(profileData)
          setUser({ ...profileData, supabase_user: session.user })
        }
      }
      setIsLoading(false)
    })

    // Listen for subsequent auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        if (isFetchingRef.current) return
        isFetchingRef.current = true
        // Deferred via setTimeout: calling another Supabase method (like the
        // profiles query in fetchProfile) synchronously inside this callback
        // deadlocks, because onAuthStateChange fires while GoTrue's internal
        // session lock is still held. Escaping to a new task lets that lock
        // release first — this is Supabase's documented workaround.
        setTimeout(async () => {
          try {
            const profileData = await fetchProfile(session.user.id)
            if (profileData) {
              setProfile(profileData)
              setUser({ ...profileData, supabase_user: session.user })
            }
          } finally {
            isFetchingRef.current = false
          }
        }, 0)
      }
      // TOKEN_REFRESHED: session is still valid, no need to re-fetch profile
    })

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Set flag before signInWithPassword so the SIGNED_IN onAuthStateChange
    // handler skips its duplicate profile fetch — login() owns this flow.
    isFetchingRef.current = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) return { success: false, error: error.message }
      if (!data.session?.user) return { success: false, error: "Session not established" }

      const profileData = await fetchProfile(data.session.user.id)
      if (!profileData) return { success: false, error: "Profile not found" }

      setProfile(profileData)
      setUser({ ...profileData, supabase_user: data.session.user })
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" }
    } finally {
      isFetchingRef.current = false
    }
  }

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole = "volunteer"
  ): Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }> => {
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

      // Supabase returns success with an empty identities array (no error) when
      // the email is already registered, to avoid leaking account existence.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return { success: false, error: "An account with this email already exists. Try logging in instead." }
      }

      // If a session came back, "Confirm email" is off in Supabase and the
      // account is already active — no confirmation email was ever sent.
      return { success: true, needsEmailConfirmation: !data.session }
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const resendConfirmation = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    // 'local' scope clears localStorage immediately without waiting for the
    // server revocation network call, preventing the logout from hanging.
    await supabase.auth.signOut({ scope: 'local' })
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, login, signup, resendConfirmation, logout, isLoading, refreshProfile }}
    >
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
