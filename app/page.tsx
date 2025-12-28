"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, getRoleRedirect } from "@/lib/auth-context"

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push(getRoleRedirect(user.role))
      } else {
        router.push("/login")
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}
