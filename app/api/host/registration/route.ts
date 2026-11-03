import { NextResponse } from "next/server";
import { z } from "zod";
import { isQm } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

const Body = z.object({ open: z.boolean() });

export async function POST(req: Request) {
  if (!(await isQm())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const { data: st } = await supabaseAdmin.from("session_state").select("phase").eq("id", 1).single();
  if (!st || !["REGISTRATION", "GROUPING"].includes(st.phase)) {
    return NextResponse.json({ error: "Registration can no longer be changed." }, { status: 409 });
  }
  const { open } = parsed.data;
  const { error } = await supabaseAdmin
    .from("session_state")
    .update({
      registration_open: open,
      phase: open ? "REGISTRATION" : "GROUPING",
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return NextResponse.json({ error: "Update failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}