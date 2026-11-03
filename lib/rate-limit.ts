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

  // occasional cleanup so the map doesn't grow forever
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return true; // allowed
}

// Best-effort client IP from proxy headers (Vercel, Nginx, Cloudflare).
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? req.headers.get("cf-connecting-ip") ?? "unknown";
}