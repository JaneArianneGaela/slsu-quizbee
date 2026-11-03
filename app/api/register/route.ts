import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { COLLEGES } from "@/lib/constants";
import { signToken, sha256, hashPin, newDeviceToken, cookieOpts } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const Body = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "Name is too long.")
    .transform((s) => s.replace(/\s+/g, " ")),
  college: z.enum(COLLEGES, { message: "Choose your college." }),
});

const TTL = 60 * 60 * 24 * 3;

export async function POST(req: Request) {
  if (!rateLimit(`reg:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { fullName, college } = parsed.data;

  const { data: st } = await supabaseAdmin
    .from("session_state")
    .select("registration_open, max_participants")
    .eq("id", 1)
    .single();
  if (!st) return NextResponse.json({ error: "Server not ready." }, { status: 500 });
  if (!st.registration_open) {
    return NextResponse.json({ error: "Registration is closed." }, { status: 403 });
  }

  const { count } = await supabaseAdmin.from("participants").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= st.max_participants) {
    return NextResponse.json({ error: "Registration is full." }, { status: 409 });
  }

  const id = randomUUID();
  const pin = String(randomInt(0, 10000)).padStart(4, "0");
  const dev = newDeviceToken();

  const { error } = await supabaseAdmin.from("participants").insert({
    id,
    full_name: fullName,
    college,
    pin_hash: hashPin(id, pin),
    device_token_hash: sha256(dev),
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That name is already registered for this college. If it's you, use Rejoin." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Could not register. Try again." }, { status: 500 });
  }

  // guard against two people grabbing the last slot at the same moment
  const { count: after } = await supabaseAdmin.from("participants").select("id", { count: "exact", head: true });
  if ((after ?? 0) > st.max_participants) {
    await supabaseAdmin.from("participants").delete().eq("id", id);
    return NextResponse.json({ error: "Registration is full." }, { status: 409 });
  }

  (await cookies()).set("pt", signToken({ pid: id, dev }, TTL), cookieOpts(TTL));
  return NextResponse.json({ pin, participant: { id, fullName, college } });
}