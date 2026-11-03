import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error("Missing Supabase env vars in .env.local");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const raw = JSON.parse(readFileSync("data/questions.seed.json", "utf8"));

const rows = raw.map((q: any) => ({
  id: q.id,
  round: q.round,
  order_no: q.order_no,
  source_college: q.source_college ?? null,
  input_mode: q.input_mode,
  prompt: q.prompt,
  options: q.options ?? null,
  correct: String(q.correct).trim().toUpperCase(),
  accepted: (q.accepted ?? []).map((a: string) => String(a).trim().toUpperCase()),
  tolerance: q.tolerance ?? 0,
  points: q.points,
  time_limit_s: q.time_limit_s,
  // grading_rule is intentionally ignored
}));

async function main() {
  const { error } = await supabase.from("questions").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`Seeded ${rows.length} questions.`);
}
main().catch((e) => { console.error(e); process.exit(1); });