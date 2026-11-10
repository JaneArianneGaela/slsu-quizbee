import { NextResponse } from "next/server";
import { z } from "zod";
import { getParticipant } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

const Body = z.object({ role: z.enum(["VIEWER", "ANSWERER"]) });

export async function POST(req: Request) {
  const me = await getParticipant();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  if (!me.group_id) return NextResponse.json({ error: "You have no group yet." }, { status: 409 });

  const { data: st } = await supabaseAdmin.from("session_state").select("phase").eq("id", 1).single();
  if (!st || !["ROLES", "LOBBY"].includes(st.phase)) {
    return NextResponse.json({ error: "Roles can't be changed right now." }, { status: 409 });
  }

  // The unique index one_answerer_per_group makes this claim atomic.
  const { error } = await supabaseAdmin
    .from("participants")
    .update({ role: parsed.data.role })
    .eq("id", me.id);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Your group already has a Representative." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not save your role." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, role: parsed.data.role });
}