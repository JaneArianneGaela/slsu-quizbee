import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { signToken, sha256, hashPin, newDeviceToken, safeEqual, cookieOpts } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const Body = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(80),
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
  const { fullName, pin } = parsed.data;

  const { data: all } = await supabaseAdmin.from("participants").select("id, full_name, college, pin_hash");
  const match = (all ?? []).find(
    (p) => norm(p.full_name) === norm(fullName) && safeEqual(hashPin(p.id, pin), p.pin_hash)
  );
  if (!match) return NextResponse.json({ error: "Name or PIN not found." }, { status: 401 });

  const dev = newDeviceToken();
  await supabaseAdmin.from("participants").update({ device_token_hash: sha256(dev) }).eq("id", match.id);
  (await cookies()).set("pt", signToken({ pid: match.id, dev }, TTL), cookieOpts(TTL));
  return NextResponse.json({
    participant: { id: match.id, fullName: match.full_name, college: match.college },
  });
}