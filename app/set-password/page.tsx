"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"

export default function SetPasswordPage() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Self-service recovery when the invite link is already expired/used --
  // e.g. a mail provider prefetched it before the person clicked. Lets them
  // request a fresh link without needing to track down an admin.
  const [resendEmail, setResendEmail] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  const router = useRouter()

  const handleResendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResending(true)
    try {
      await fetch("/api/auth/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      })
    } finally {
      setIsResending(false)
      setResendSent(true)
    }
  }

  useEffect(() => {
    const supabase = createClient()

    // Invite links land here with the session tokens in the URL hash
    // (#access_token=...&refresh_token=...), not a `?code=` query param.
    // @supabase/ssr's createBrowserClient hard-codes flowType: "pkce", which
    // only auto-detects the `?code=` style -- it never picks up these hash
    // tokens on its own, so the session silently never gets established.
    // Parse and apply them manually instead of relying on detectSessionInUrl.
    const establish = async () => {
      const hash = window.location.hash
      if (hash.includes("access_token")) {
        const params = new URLSearchParams(hash.slice(1))
        const access_token = params.get("access_token")
        const refresh_token = params.get("refresh_token")
        // Strip the tokens from the visible URL either way -- they're
        // single-use and shouldn't linger in history/address bar.
        window.history.replaceState(null, "", window.location.pathname)
        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (!error && data.session) {
            setHasSession(true)
            setCheckingSession(false)
            return
          }
        }
      }
      const { data } = await supabase.auth.getSession()
      setHasSession(!!data.session)
      setCheckingSession(false)
    }

    establish()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setIsLoading(false)
      setError(updateError.message)
      return
    }

    // Account is only really usable from this point on -- flip the profile
    // out of "pending" now that the invite has actually been completed.
    if (updateData.user) {
      await supabase.from("profiles").update({ status: "active" }).eq("id", updateData.user.id)
    }

    setIsLoading(false)
    setSuccess(true)
    setTimeout(() => router.push("/dashboard"), 1500)
  }

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/logo-citichurch.png"
            alt="Citichurch"
            className="mx-auto h-12 w-auto object-contain mb-2"
          />
          <p className="text-muted-foreground">Production Ministry Hub</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome to the team!</CardTitle>
            <CardDescription>Set a password to activate your account</CardDescription>
          </CardHeader>
          <CardContent>
            {checkingSession ? (
              <div className="py-6 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !hasSession ? (
              <div className="space-y-4">
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This invite link is invalid or has expired. This can happen if it was opened automatically by
                    your email provider before you clicked it, or if too much time has passed.
                  </AlertDescription>
                </Alert>

                {resendSent ? (
                  <div className="text-center space-y-2 py-2">
                    <CheckCircle2 className="w-8 h-8 text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      If <span className="text-foreground font-medium">{resendEmail}</span> has a pending invite, a
                      fresh link is on its way. Check your inbox.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleResendInvite} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="resend-email">Get a new invite link</Label>
                      <Input
                        id="resend-email"
                        type="email"
                        placeholder="Enter the email you were invited with"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <Button type="submit" variant="outline" className="w-full h-11" disabled={isResending}>
                      {isResending ? (
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Send Me a New Link"
                      )}
                    </Button>
                  </form>
                )}
              </div>
            ) : success ? (
              <div className="text-center space-y-2 py-4">
                <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Password set! Taking you to your dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative" suppressHydrationWarning>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Set Password & Continue"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
