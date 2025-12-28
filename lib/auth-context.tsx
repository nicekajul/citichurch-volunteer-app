"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type User, type UserRole, initialUsers } from "./data"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => boolean
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("citichurch_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (username: string, password: string): boolean => {
    const foundUser = initialUsers.find((u) => u.username === username && u.password === password)

    if (foundUser) {
      setUser(foundUser)
      localStorage.setItem("citichurch_user", JSON.stringify(foundUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("citichurch_user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
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
    case "team_leader":
      return "/dashboard/leader"
    case "volunteer":
      return "/dashboard/volunteer"
    default:
      return "/login"
  }
}
