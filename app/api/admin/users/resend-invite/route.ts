import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Admin client — service role key, required to re-invite auth users.
// Never expose this client or its key to the browser.
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Plain (anon-key) client — used only for the resetPasswordForEmail fallback
// below, which is a public auth method, not an admin one.
const supabaseAnon = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body as { userId?: string }
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Authenticate the caller and confirm they're an admin.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Only admins can resend invites" }, { status: 403 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, name, status")
      .eq("id", userId)
      .single()
    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    if (profile.status !== "pending") {
      return NextResponse.json(
        { error: "This user has already activated their account — nothing to resend." },
        { status: 409 }
      )
    }

    const origin = new URL(request.url).origin
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(profile.email, {
      data: { name: profile.name || undefined, role: "volunteer" },
      redirectTo: `${origin}/set-password`,
    })

    if (inviteError) {
      // inviteUserByEmail always fails with "already registered" here, because
      // the original invite already created the auth user -- it's just still
      // unconfirmed/passwordless. There's no "re-invite" admin API for that
      // case, so fall back to a password-recovery email instead, which works
      // regardless of confirmation status and lands on the same /set-password
      // page (it only cares whether a valid session came back).
      const alreadyRegistered = /already registered|already exists/i.test(inviteError.message)
      if (!alreadyRegistered) {
        return NextResponse.json({ error: `Failed to resend invite: ${inviteError.message}` }, { status: 500 })
      }
      const { error: resetError } = await supabaseAnon.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${origin}/set-password`,
      })
      if (resetError) {
        return NextResponse.json({ error: `Failed to resend invite: ${resetError.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Resend invite error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}
