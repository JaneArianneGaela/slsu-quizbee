import { NextResponse } from "next/server";
import { z } from "zod";
import { isQm } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

const Body = z.object({ phase: z.enum(["LOBBY"]) });

export async function POST(req: Request) {
  if (!(await isQm())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid phase." }, { status: 400 });

  const { data: st } = await supabaseAdmin.from("session_state").select("phase").eq("id", 1).single();
  if (st?.phase !== "ROLES") return NextResponse.json({ error: "Spin the wheel first." }, { status: 409 });

  await supabaseAdmin
    .from("session_state")
    .update({ phase: "LOBBY", updated_at: new Date().toISOString() })
    .eq("id", 1);
  return NextResponse.json({ ok: true });
}