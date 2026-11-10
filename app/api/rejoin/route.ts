import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { COLLEGES, officialGroupFor } from "@/lib/constants";
import { signToken, sha256, hashPin, newDeviceToken, safeEqual, cookieOpts } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const Body = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(80),
  college: z.enum(COLLEGES, { message: "Choose your department." }),
  groupId: z.number().int().min(1).max(7),
  role: z.enum(["VIEWER", "ANSWERER"]),
  pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits."),
});

const TTL = 60 * 60 * 24 * 3;
const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export async function POST(req: Request) {
  if (!rateLimit(`rejoin:${clientIp(req)}`, 8, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { fullName, college, groupId, role, pin } = parsed.data;
  const officialGroup = officialGroupFor(fullName, college);
  if (!officialGroup) {
    return NextResponse.json({ error: "Your name and department are not on the announced participant roster." }, { status: 403 });
  }
  if (groupId !== officialGroup) {
    return NextResponse.json({ error: `Your announced group is Group ${officialGroup}.` }, { status: 400 });
  }

  const { data: all } = await supabaseAdmin
    .from("participants")
    .select("id, full_name, college, group_id, role, pin_hash");
  const match = (all ?? []).find(
    (p) =>
      norm(p.full_name) === norm(fullName) &&
      p.college === college &&
      safeEqual(hashPin(p.id, pin), p.pin_hash)
  );
  if (!match) return NextResponse.json({ error: "Name or PIN not found." }, { status: 401 });

  const { data: st } = await supabaseAdmin.from("session_state").select("phase").eq("id", 1).single();
  const canEdit = ["REGISTRATION", "GROUPING", "ROLES", "LOBBY"].includes(st?.phase ?? "");
  if (!canEdit && match.group_id !== officialGroup) {
    return NextResponse.json({ error: "Your saved group does not match the announced roster. Contact a Quiz Master." }, { status: 409 });
  }
  const nextGroup = canEdit ? officialGroup : match.group_id;
  const nextRole = canEdit ? role : match.role;
  if (!canEdit && (groupId !== match.group_id || role !== match.role)) {
    return NextResponse.json({ error: "Your group and role are locked after the quiz starts." }, { status: 409 });
  }

  const dev = newDeviceToken();
  const { error } = await supabaseAdmin
    .from("participants")
    .update({
      group_id: nextGroup,
      role: nextRole,
      device_token_hash: sha256(dev),
    })
    .eq("id", match.id);
  if (error) {
    if (error.code === "23505" && error.message.includes("one_answerer_per_group")) {
      return NextResponse.json({ error: "That group already has a Representative." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not sign in. Try again." }, { status: 500 });
  }
  (await cookies()).set("pt", signToken({ pid: match.id, dev }, TTL), cookieOpts(TTL));
  return NextResponse.json({
    participant: { id: match.id, fullName: match.full_name, college: match.college },
  });
}