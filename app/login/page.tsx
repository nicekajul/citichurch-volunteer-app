"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth, getRoleRedirect } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [showDemo, setShowDemo] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault()
        setShowDemo((v) => !v)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await login(email, password)

    if (result.success) {
      // Middleware will handle redirect based on role
      router.push("/dashboard")
    } else {
      setError(result.error || "Invalid email or password")
    }

    setIsLoading(false)
  }

  const demoCredentials = [
    { role: "Admin", email: "admin@citichurch.com", password: "admin123" },
    { role: "Team Leader", email: "leader@citichurch.com", password: "leader123" },
    { role: "Volunteer", email: "volunteer@citichurch.com", password: "volunteer123" },
  ]

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo Section */}
        <div className="text-center space-y-2">
          <img
            src="/logo-citichurch.png"
            alt="Citichurch"
            className="mx-auto h-12 w-auto object-contain mb-2"
          />
          <p className="text-muted-foreground">Production Ministry Hub</p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative" suppressHydrationWarning>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                    suppressHydrationWarning
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Want to join a team? </span>
              <Link href="/apply" className="text-primary hover:underline font-medium">
                Apply here
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials — hidden, toggle with Ctrl+Shift+D */}
        {showDemo && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Demo Credentials</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/setup-demo")}
                className="text-xs h-7 px-2"
              >
                Setup Demo Users
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {demoCredentials.map((cred) => (
                  <button
                    key={cred.role}
                    onClick={() => {
                      setEmail(cred.email)
                      setPassword(cred.password)
                    }}
                    className="w-full flex flex-col items-start p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm gap-1"
                  >
                    <span className="font-medium">{cred.role}</span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {cred.email}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
