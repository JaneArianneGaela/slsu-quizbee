import { NextResponse } from "next/server";
import { z } from "zod";
import { isQm } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { COLLEGES } from "@/lib/constants";

const Patch = z.object({
  fullName: z.string().trim().min(2).max(80).transform((s) => s.replace(/\s+/g, " ")).optional(),
  college: z.enum(COLLEGES).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isQm())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const update: Record<string, string> = {};
  if (parsed.data.fullName) update.full_name = parsed.data.fullName;
  if (parsed.data.college) update.college = parsed.data.college;
  if (!Object.keys(update).length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const { error } = await supabaseAdmin.from("participants").update(update).eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That name + college already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isQm())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabaseAdmin.from("participants").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}