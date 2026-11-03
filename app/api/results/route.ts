import { NextResponse } from "next/server";
import { getParticipant, isQm } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getStandings, firstTie } from "@/lib/standings";

export async function GET() {
  const [me, qm] = await Promise.all([getParticipant(), isQm()]);
  if (!me && !qm) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: st } = await supabaseAdmin
    .from("session_state")
    .select("phase, current_question_id, current_round, clincher_groups")
    .eq("id", 1)
    .single();
  const phase = st?.phase ?? "";
  const qid = st?.current_question_id ?? null;

  let mine: { answer: string; correct?: boolean; points?: number } | null = null;
  let reveal: unknown = null;

  if (qid && ["QUESTION_LIVE", "REVEALED"].includes(phase)) {
    const { data: subs } = await supabaseAdmin
      .from("submissions")
      .select("group_id, answer, is_correct, points_awarded, elapsed_ms")
      .eq("question_id", qid);
    const all = subs ?? [];
    const revealed = phase === "REVEALED";

    const own = me?.group_id ? all.find((s) => s.group_id === me.group_id) : undefined;
    if (own) {
      mine = revealed
        ? { answer: own.answer, correct: !!own.is_correct, points: own.points_awarded }
        : { answer: own.answer };
    }

    if (revealed) {
      const { data: groups } = await supabaseAdmin.from("groups").select("id, label, color").order("id");
      const clincher = st?.current_round === "CL";
      const inPlay = Array.isArray(st?.clincher_groups) ? (st!.clincher_groups as number[]) : [];

      const places = new Map<number, number>();
      const ranked = all.filter((s) => s.is_correct).sort((a, b) => (a.elapsed_ms ?? 0) - (b.elapsed_ms ?? 0));
      ranked.forEach((s, i) => {
        const prev = ranked[i - 1];
        const same = prev && (prev.elapsed_ms ?? 0) === (s.elapsed_ms ?? 0);
        places.set(s.group_id, same ? places.get(prev.group_id)! : i + 1);
      });

      reveal = {
        groups: (groups ?? [])
          .filter((g) => !clincher || inPlay.includes(g.id))
          .map((g) => {
            const s = all.find((x) => x.group_id === g.id);
            return {
              groupId: g.id,
              label: g.label,
              color: g.color,
              answered: !!s,
              answer: s?.answer ?? null,
              correct: !!s?.is_correct,
              points: s?.points_awarded ?? 0,
              place: s?.is_correct ? places.get(g.id) ?? null : null,
            };
          }),
      };
    }
  }

  let standings = null;
  let tied: number[] = [];
  if (["REVEALED", "ROUND_SCOREBOARD", "FINAL"].includes(phase)) {
    standings = await getStandings();
    tied = firstTie(standings);
  }

  return NextResponse.json({ questionId: qid, phase, mine, reveal, standings, tied });
}