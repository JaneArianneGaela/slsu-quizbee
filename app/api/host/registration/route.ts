import { NextResponse } from "next/server";
import { z } from "zod";
import { isQm } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

const Body = z.object({ open: z.boolean() });

// Phases before the first question. After this, registration is locked for good.
const PRE_QUIZ = ["REGISTRATION", "GROUPING", "ROLES", "LOBBY"];

export async function POST(req: Request) {
  if (!(await isQm())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const { data: st } = await supabaseAdmin.from("session_state").select("phase").eq("id", 1).single();
  if (!st || !PRE_QUIZ.includes(st.phase)) {
    return NextResponse.json({ error: "Registration can no longer be changed." }, { status: 409 });
  }

  const { open } = parsed.data;

  // Closing is only allowed from REGISTRATION or GROUPING.
  if (!open && !["REGISTRATION", "GROUPING"].includes(st.phase)) {
    return NextResponse.json({ error: "Registration is already closed." }, { status: 409 });
  }

  // Reopening after the wheel was spun: wipe groups and roles so everyone is re-spun together.
  if (open && ["ROLES", "LOBBY"].includes(st.phase)) {
    const { error: clearErr } = await supabaseAdmin
      .from("participants")
      .update({ group_id: null, role: null })
      .not("id", "is", null);
    if (clearErr) return NextResponse.json({ error: "Could not clear the groups." }, { status: 500 });

    // Clear the spin marker so players see the wheel again on the next spin.
    await supabaseAdmin.from("session_state").update({ spin_at: null }).eq("id", 1);
  }

  // Phase guard makes this atomic against a double-click.
  const { data, error } = await supabaseAdmin
    .from("session_state")
    .update({
      registration_open: open,
      phase: open ? "REGISTRATION" : "GROUPING",
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .eq("phase", st.phase)
    .select("id");
  if (error) return NextResponse.json({ error: "Update failed." }, { status: 500 });
  if (!data?.length) {
    return NextResponse.json({ error: "The state just changed. Refresh and try again." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}