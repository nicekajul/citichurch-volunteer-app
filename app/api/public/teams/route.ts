import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, description, icon, color")
      .order("name")

    if (error) throw new Error(error.message)

    return NextResponse.json({ teams: data || [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
