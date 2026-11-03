import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/env";
import { signToken, sha256, safeEqual, cookieOpts } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const Body = z.object({ password: z.string().min(1, "Enter the password.") });

export async function POST(req: Request) {
  if (!rateLimit(`qm:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  if (!safeEqual(sha256(parsed.data.password), sha256(env.QM_PASSWORD))) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const ttl = 60 * 60 * 12;
  (await cookies()).set("qm_session", signToken({ role: "qm" }, ttl), cookieOpts(ttl));
  return NextResponse.json({ ok: true });
}