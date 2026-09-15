import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Self-service version of /api/admin/users/resend-invite -- for the person
// who's stuck on an expired/already-used invite link, with no session and no
// admin to ask. Deliberately unauthenticated (mirrors /forgot-password),
// since the whole point is recovering when you can't sign in yet.
//
// Always returns the same generic success response regardless of whether the
// email exists or has a pending invite, so this can't be used to enumerate
// registered accounts -- same privacy rule as requestPasswordReset().
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const supabaseAnon = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body as { email?: string }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Missing email" }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, name, status")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle()

    // Only act for an account that's still pending activation. Silently no-op
    // otherwise (unknown email, or already active) -- the response is
    // identical either way so this can't be used to probe account status.
    if (profile && profile.status === "pending") {
      const origin = new URL(request.url).origin
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(profile.email, {
        data: { name: profile.name || undefined, role: "volunteer" },
        redirectTo: `${origin}/set-password`,
      })
      if (inviteError) {
        // Expected path: the auth user already exists from the original
        // invite, so inviteUserByEmail always fails here. Fall back to a
        // password-recovery email, which works regardless of confirmation
        // status. See /api/admin/users/resend-invite for the same pattern.
        const alreadyRegistered = /already registered|already exists/i.test(inviteError.message)
        if (alreadyRegistered) {
          await supabaseAnon.auth.resetPasswordForEmail(profile.email, {
            redirectTo: `${origin}/set-password`,
          })
        } else {
          console.error("Self-service resend invite error:", inviteError.message)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Self-service resend invite error:", err)
    // Still return success shape to avoid leaking anything via error content.
    return NextResponse.json({ success: true })
  }
}
