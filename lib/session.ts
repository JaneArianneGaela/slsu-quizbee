import "server-only";
import { cookies } from "next/headers";
import { verifyToken, sha256 } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function isQm(): Promise<boolean> {
  const token = (await cookies()).get("qm_session")?.value;
  return verifyToken<{ role: string }>(token)?.role === "qm";
}

export async function getParticipant() {
  const token = (await cookies()).get("pt")?.value;
  const p = verifyToken<{ pid: string; dev: string }>(token);
  if (!p) return null;
  const { data } = await supabaseAdmin
    .from("participants")
    .select("id, full_name, college, group_id, role, device_token_hash")
    .eq("id", p.pid)
    .maybeSingle();
  if (!data || data.device_token_hash !== sha256(p.dev)) return null;
  return data;
}