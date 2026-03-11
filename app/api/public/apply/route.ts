import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { teamId, motivation, experience, availability, applicantName, applicantEmail, applicantPhone } = body

    if (!teamId || !motivation || !applicantName || !applicantEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user is authenticated — if so, link by applicant_id
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("ministry_applications")
      .insert({
        applicant_id: user?.id ?? null,
        team_id: teamId,
        motivation,
        experience: experience || "",
        availability: availability || [],
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        applicant_phone: applicantPhone || null,
        status: "pending",
      })
      .select("id")
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
