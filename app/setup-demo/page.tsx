"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Church, CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface DemoUser {
  email: string
  password: string
  name: string
  role: "admin" | "leader" | "volunteer"
  team_id?: string
}

const demoUsers: DemoUser[] = [
  {
    email: "admin@citichurch.com",
    password: "admin123",
    name: "Admin User",
    role: "admin",
  },
  {
    email: "leader@citichurch.com",
    password: "leader123",
    name: "John Leader",
    role: "leader",
    team_id: "11111111-1111-1111-1111-111111111111", // Broadcast team
  },
  {
    email: "volunteer@citichurch.com",
    password: "volunteer123",
    name: "Sarah Volunteer",
    role: "volunteer",
    team_id: "11111111-1111-1111-1111-111111111111", // Broadcast team
  },
]

export default function SetupDemoPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [results, setResults] = useState<{ email: string; success: boolean; error?: string }[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const createDemoUsers = async () => {
    setIsCreating(true)
    const newResults: { email: string; success: boolean; error?: string }[] = []

    for (const user of demoUsers) {
      try {
        // Try to sign up the user
        const { data, error } = await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              name: user.name,
              role: user.role,
              team_id: user.team_id || null,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })

        if (error) {
          // Check if user already exists
          if (error.message.includes("already registered")) {
            newResults.push({ email: user.email, success: true, error: "Already exists" })
          } else {
            newResults.push({ email: user.email, success: false, error: error.message })
          }
        } else if (data.user) {
          // Update the profile with team_id if provided
          if (user.team_id) {
            await supabase.from("profiles").update({ team_id: user.team_id }).eq("id", data.user.id)
          }
          newResults.push({ email: user.email, success: true })
        }
      } catch (error) {
        newResults.push({
          email: user.email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }

      setResults([...newResults])
      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setIsCreating(false)
    setIsComplete(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Logo Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Church className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Citichurch Demo Setup</h1>
          <p className="text-muted-foreground">Create demo user accounts for testing</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Demo User Creation</CardTitle>
            <CardDescription>
              This will create three demo accounts: an admin, a team leader, and a volunteer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isCreating && results.length === 0 && (
              <Button onClick={createDemoUsers} className="w-full h-11" size="lg">
                Create Demo Users
              </Button>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                  >
                    {result.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{result.email}</p>
                      {result.error && (
                        <p className="text-xs text-muted-foreground mt-0.5">{result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isCreating && (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Creating demo users...</p>
              </div>
            )}

            {isComplete && (
              <>
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Demo users have been created successfully! You can now log in with any of the demo
                    credentials.
                  </AlertDescription>
                </Alert>

                <Button onClick={() => router.push("/login")} className="w-full h-11" size="lg">
                  Go to Login
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Demo Credentials</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {demoUsers.map((user) => (
                <div key={user.email} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm capitalize">{user.role}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{user.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{user.password}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
