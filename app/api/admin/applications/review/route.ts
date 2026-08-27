import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Admin client — service role key, required to create/invite auth users.
// Never expose this client or its key to the browser.
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId, status, notes } = body as {
      applicationId?: string
      status?: "approved" | "rejected"
      notes?: string
    }

    if (!applicationId || (status !== "approved" && status !== "rejected")) {
      return NextResponse.json({ error: "Missing or invalid applicationId/status" }, { status: 400 })
    }
    if (status === "rejected" && !notes?.trim()) {
      return NextResponse.json({ error: "A reason is required to reject an application" }, { status: 400 })
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
      return NextResponse.json({ error: "Only admins can review applications" }, { status: 403 })
    }

    // Fetch the application (admin RLS already allows reading any application,
    // but supabaseAdmin is used from here on to keep the rest of this atomic
    // and unaffected by RLS edge cases).
    const { data: application, error: appError } = await supabaseAdmin
      .from("ministry_applications")
      .select("*")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }
    if (application.status !== "pending") {
      return NextResponse.json({ error: "This application has already been reviewed" }, { status: 409 })
    }

    let applicantId: string | null = application.applicant_id
    let invited = false

    if (status === "approved" && !applicantId) {
      // Walk-in applicant with no account yet — create one and email an invite.
      if (!application.applicant_email) {
        return NextResponse.json(
          { error: "Cannot approve: this application has no email on file" },
          { status: 400 }
        )
      }

      const origin = new URL(request.url).origin
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        application.applicant_email,
        {
          data: { name: application.applicant_name || undefined, role: "volunteer" },
          redirectTo: `${origin}/set-password`,
        }
      )

      if (inviteError) {
        // If they already have an account (e.g. applied as a walk-in with the
        // same email as an existing member), link to that account instead of
        // failing the whole approval.
        const alreadyExists = /already registered|already exists/i.test(inviteError.message)
        if (!alreadyExists) {
          return NextResponse.json({ error: `Failed to invite applicant: ${inviteError.message}` }, { status: 500 })
        }
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", application.applicant_email)
          .single()
        if (!existingProfile) {
          return NextResponse.json(
            { error: "An account with this email already exists, but it could not be found to link." },
            { status: 500 }
          )
        }
        applicantId = existingProfile.id
      } else {
        applicantId = inviteData.user.id
        invited = true
      }
    }

    if (status === "approved" && applicantId) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ team_id: application.team_id, status: "active" })
        .eq("id", applicantId)
      if (profileError) {
        return NextResponse.json({ error: `Failed to assign team: ${profileError.message}` }, { status: 500 })
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("ministry_applications")
      .update({
        status,
        applicant_id: applicantId,
        reviewed_by: user.id,
        review_notes: notes || null,
      })
      .eq("id", applicationId)

    if (updateError) {
      return NextResponse.json({ error: `Failed to update application: ${updateError.message}` }, { status: 500 })
    }

    // Notify the applicant, but only if they already had an account before
    // today (a freshly invited user has no session to receive an in-app
    // notification in yet — their invite email is the notification).
    if (applicantId && !invited) {
      const { data: team } = await supabaseAdmin.from("teams").select("name").eq("id", application.team_id).single()
      const teamName = team?.name || "the team"
      await supabaseAdmin.from("notifications").insert([{
        user_id: applicantId,
        title: status === "approved" ? "Application Approved! 🎉" : "Application Update",
        message:
          status === "approved"
            ? `Welcome to ${teamName}! Your application has been approved. You can now access your team dashboard.`
            : `Your application for ${teamName} was not approved this time.${notes ? ` Note: ${notes}` : ""}`,
        type: "application",
        link: "/dashboard",
      }])
    }

    return NextResponse.json({ success: true, invited })
  } catch (err) {
    console.error("Application review error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}
