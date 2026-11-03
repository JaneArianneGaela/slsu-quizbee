import "server-only";
import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function signToken(payload: object, ttlSeconds: number): string {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })
  ).toString("base64url");
  const sig = createHmac("sha256", env.SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken<T extends object>(token: string | undefined): (T & { exp: number }) | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", env.SESSION_SECRET).update(body).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof p.exp !== "number" || p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const newDeviceToken = () => randomBytes(24).toString("base64url");

// PIN is never stored in plain text; it is bound to the participant id.
export function hashPin(participantId: string, pin: string) {
  return createHmac("sha256", env.SESSION_SECRET).update(`${participantId}|${pin}`).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

// Simple in-memory limiter: max `limit` hits per `windowMs` for a given key.
// Fine for one Node instance; on serverless each instance has its own counter.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 10, windowMs = 10_000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false; // blocked
  }
  recent.push(now);
  hits.set(key, recent);
  return true; // allowed
}