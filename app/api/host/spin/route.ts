import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { isQm } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { COLLEGES } from "@/lib/constants";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1); // crypto-secure
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST() {
  if (!(await isQm())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: st } = await supabaseAdmin.from("session_state").select("phase").eq("id", 1).single();
  if (!st || !["GROUPING", "ROLES"].includes(st.phase)) {
    return NextResponse.json({ error: "Close registration first, then assign groups." }, { status: 409 });
  }

  const { data: people } = await supabaseAdmin.from("participants").select("id, full_name, college");
  if (!people?.length) return NextResponse.json({ error: "No participants registered." }, { status: 400 });

  // clear any previous group assignment
  const clear = await supabaseAdmin
    .from("participants")
    .update({ group_id: null, role: null })
    .not("id", "is", null);
  if (clear.error) return NextResponse.json({ error: "Could not reset groups." }, { status: 500 });

  // shuffle group labels, then deal each college round-robin, continuing the pointer
  const groupOrder = shuffle([1, 2, 3, 4, 5, 6]);
  let pointer = 0;
  const assignments: { id: string; name: string; college: string; group_id: number }[] = [];

  for (const college of COLLEGES) {
    const members = shuffle(people.filter((p) => p.college === college));
    for (const m of members) {
      assignments.push({
        id: m.id,
        name: m.full_name,
        college,
        group_id: groupOrder[pointer % 6],
      });
      pointer++;
    }
  }

  const results = await Promise.all(
    assignments.map((a) =>
      supabaseAdmin.from("participants").update({ group_id: a.group_id }).eq("id", a.id)
    )
  );
  if (results.some((r) => r.error)) {
    return NextResponse.json({ error: "Saving group assignments failed. Try again." }, { status: 500 });
  }

  await supabaseAdmin
    .from("session_state")
    .update({ phase: "ROLES", spin_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", 1);

  return NextResponse.json({ success: true });
}
