"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { requestPasswordReset } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await requestPasswordReset(email)

    // Show the same success state regardless of whether the email is
    // registered -- confirming account existence here would be a privacy leak.
    if (result.success || result.error) {
      setSent(true)
    }
    setIsLoading(false)
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
            <CardTitle className="text-xl">Reset your password</CardTitle>
            <CardDescription>
              {sent
                ? "Check your inbox for a reset link"
                : "Enter your email and we'll send you a link to reset it"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4 py-2">
                <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If an account exists for <span className="text-foreground font-medium">{email}</span>, a
                  password reset link is on its way. The link expires in 1 hour.
                </p>
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                </Link>
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

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <div className="text-center text-sm">
                  <Link href="/login" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
