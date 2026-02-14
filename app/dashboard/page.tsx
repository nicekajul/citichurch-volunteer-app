"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, getRoleRedirect } from "@/lib/auth-context"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user?.role) {
      const redirect = getRoleRedirect(user.role)
      router.replace(redirect)
    } else if (!isLoading && !user) {
      router.replace("/login")
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
