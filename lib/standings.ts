import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

export type Row = {
  groupId: number;
  label: string;
  color: string;
  r1: number;
  r2: number;
  r3: number;
  cl: number;
  main: number;
  rank: number;
};

export async function getStandings(): Promise<Row[]> {
  const [{ data: groups }, { data: subs }] = await Promise.all([
    supabaseAdmin.from("groups").select("id, label, color").order("id"),
    supabaseAdmin.from("submissions").select("group_id, question_id, points_awarded"),
  ]);

  const rows: Row[] = (groups ?? []).map((g) => ({
    groupId: g.id, label: g.label, color: g.color,
    r1: 0, r2: 0, r3: 0, cl: 0, main: 0, rank: 0,
  }));
  const by = new Map(rows.map((r) => [r.groupId, r]));

  for (const s of subs ?? []) {
    const r = by.get(s.group_id);
    if (!r) continue;
    const round = s.question_id.split("-")[0];
    if (round === "R1") r.r1 += s.points_awarded;
    else if (round === "R2") r.r2 += s.points_awarded;
    else if (round === "R3") r.r3 += s.points_awarded;
    else if (round === "CL") r.cl += s.points_awarded;
  }
  rows.forEach((r) => (r.main = r.r1 + r.r2 + r.r3));

  // main score first, clincher points break ties
  rows.sort((a, b) => b.main - a.main || b.cl - a.cl || a.groupId - b.groupId);
  rows.forEach((r, i) => {
    const p = rows[i - 1];
    r.rank = p && p.main === r.main && p.cl === r.cl ? p.rank : i + 1;
  });
  return rows;
}

// The highest-ranked tie that touches 1st, 2nd or 3rd place. Empty if none.
export function firstTie(rows: Row[]): number[] {
  for (const r of rows) {
    if (r.rank > 3) break;
    const cluster = rows.filter((x) => x.rank === r.rank);
    if (cluster.length > 1) return cluster.map((x) => x.groupId);
  }
  return [];
}