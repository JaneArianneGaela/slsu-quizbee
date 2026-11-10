import { NextResponse } from "next/server";
import { isQm } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  if (!(await isQm())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [{ data: participants }, { data: state }] = await Promise.all([
    supabaseAdmin
      .from("participants")
      .select("id, full_name, college, group_id, role, created_at")
      .order("created_at"),
    supabaseAdmin.from("session_state").select("phase, registration_open, max_participants").eq("id", 1).single(),
  ]);
  return NextResponse.json({
    participants: participants ?? [],
    registration_open: state?.registration_open ?? true,
    max_participants: state?.max_participants ?? 28,
    phase: state?.phase ?? "REGISTRATION",
  });
}