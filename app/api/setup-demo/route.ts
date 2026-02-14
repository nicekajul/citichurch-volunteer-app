import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

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
    team_id: "11111111-1111-1111-1111-111111111111",
  },
  {
    email: "volunteer@citichurch.com",
    password: "volunteer123",
    name: "Sarah Volunteer",
    role: "volunteer",
    team_id: "11111111-1111-1111-1111-111111111111",
  },
]

export async function POST() {
  try {
    const results: { email: string; success: boolean; error?: string }[] = []

    for (const user of demoUsers) {
      try {
        // Create user with admin API - this bypasses email confirmation
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: user.name,
            role: user.role,
          },
        })

        if (error) {
          if (error.message.includes("already exists") || error.message.includes("already registered")) {
            results.push({ email: user.email, success: true, error: "Already exists" })
          } else {
            results.push({ email: user.email, success: false, error: error.message })
          }
        } else if (data.user) {
          // Update profile with role and team_id
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({
              role: user.role,
              team_id: user.team_id || null,
              name: user.name,
            })
            .eq("id", data.user.id)

          if (profileError) {
            console.error("[v0] Profile update error:", profileError)
          }

          results.push({ email: user.email, success: true })
        }
      } catch (error) {
        results.push({
          email: user.email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("[v0] Setup demo error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
