"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, getRoleRedirect } from "@/lib/auth-context"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    console.log("[v0] Dashboard page - user:", user, "isLoading:", isLoading)
    
    if (!isLoading) {
      if (user?.role) {
        const redirect = getRoleRedirect(user.role)
        console.log("[v0] Redirecting to:", redirect)
        router.replace(redirect)
      } else {
        console.log("[v0] No user found, redirecting to login")
        router.replace("/login")
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
