import { NextResponse } from "next/server";
import { z } from "zod";
import { isQm } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

const Body = z.object({
  participantId: z.string().uuid(),
  role: z.enum(["VIEWER", "ANSWERER"]).nullable(),
});

export async function POST(req: Request) {
  if (!(await isQm())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  const { participantId, role } = parsed.data;

  const { data: p } = await supabaseAdmin
    .from("participants")
    .select("id, group_id")
    .eq("id", participantId)
    .maybeSingle();
  if (!p?.group_id) return NextResponse.json({ error: "Participant has no group." }, { status: 409 });

  if (role === "ANSWERER") {
    // Demote the current Representative of that group first.
    await supabaseAdmin
      .from("participants")
      .update({ role: "VIEWER" })
      .eq("group_id", p.group_id)
      .eq("role", "ANSWERER")
      .neq("id", p.id);
  }
  const { error } = await supabaseAdmin.from("participants").update({ role }).eq("id", p.id);
  if (error) return NextResponse.json({ error: "Could not change the role." }, { status: 500 });
  return NextResponse.json({ ok: true });
}