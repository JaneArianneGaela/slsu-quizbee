import { NextResponse } from "next/server";
import { getParticipant, isQm } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const [me, qm] = await Promise.all([getParticipant(), isQm()]);
  if (!me && !qm) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const [{ data: st }, { data: groups }, { data: people }, { data: ord }] = await Promise.all([
    supabaseAdmin
      .from("session_state")
      .select("phase, registration_open, spin_at, current_index, current_question_id, deadline, paused_remaining_ms")
      .eq("id", 1)
      .single(),
    supabaseAdmin.from("groups").select("id, label, color").order("id"),
    supabaseAdmin.from("participants").select("id, full_name, college, group_id, role"),
    supabaseAdmin.from("quiz_order").select("order_ids").eq("id", 1).maybeSingle(),
  ]);

  const phase: string = st?.phase ?? "REGISTRATION";
  const list = people ?? [];
  const grouped = !["REGISTRATION", "GROUPING"].includes(phase);

  const view = grouped
    ? (groups ?? []).map((g) => ({
        ...g,
        members: list
          .filter((p) => p.group_id === g.id)
          .sort((a, b) => a.full_name.localeCompare(b.full_name))
          .map((p) => ({ id: p.id, name: p.full_name, college: p.college, role: p.role })),
      }))
    : [];

  const order: string[] = Array.isArray(ord?.order_ids) ? (ord!.order_ids as string[]) : [];

  // The question is only sent while it is live or revealed.
  // The answer is only sent at reveal (or to the QM).
  let question = null;
  if (st?.current_question_id && ["QUESTION_LIVE", "REVEALED"].includes(phase)) {
    const { data: q } = await supabaseAdmin
      .from("questions")
      .select("id, round, input_mode, prompt, options, points, time_limit_s, correct, accepted")
      .eq("id", st.current_question_id)
      .single();
    if (q) {
      const inRound = order.filter((id) => id.split("-")[0] === q.round);
      const showAnswer = qm || phase === "REVEALED";
      question = {
        id: q.id,
        round: q.round,
        number: inRound.indexOf(q.id) + 1,
        totalInRound: inRound.length,
        inputMode: q.input_mode,
        prompt: q.prompt,
        options: q.options,
        points: q.points,
        timeLimitS: q.time_limit_s,
        ...(showAnswer ? { correct: q.correct, accepted: q.accepted } : {}),
      };
    }
  }

  const deadlineMs = st?.deadline ? new Date(st.deadline).getTime() : null;
  const pausedRemainingMs: number | null = st?.paused_remaining_ms ?? null;
  const serverNow = Date.now();
  const effectivePhase =
    phase === "QUESTION_LIVE" && pausedRemainingMs == null && deadlineMs !== null && serverNow >= deadlineMs
      ? "LOCKED"
      : phase;

  return NextResponse.json({
    phase,
    effectivePhase,
    registrationOpen: st ? true : true,
    spinAt: st?.spin_at ?? null,
    registered: list.length,
    isQm: qm,
    me: me
      ? { id: me.id, fullName: me.full_name, college: me.college, groupId: me.group_id, role: me.role }
      : null,
    groups: view,
    groupsReady: view.filter((g) => g.members.some((m) => m.role === "ANSWERER")).length,
    serverNow,
    deadlineMs,
    pausedRemainingMs,
    question,
    index: st?.current_index ?? -1,
    totalQuestions: order.length,
  });
}