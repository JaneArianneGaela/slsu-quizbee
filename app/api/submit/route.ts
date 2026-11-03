import { NextResponse } from "next/server";
import { z } from "zod";
import { getParticipant } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { grade, sanitizeInput } from "@/lib/grade";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({ answer: z.string().max(200) });

export async function POST(req: Request) {
  const received = Date.now();
  const fail = (m: string, code = 409) => NextResponse.json({ error: m }, { status: code });

  const me = await getParticipant();
  if (!me) return fail("Not signed in.", 401);
  if (me.role !== "ANSWERER" || !me.group_id) return fail("Only your group's Answerer can submit.", 403);
  if (!rateLimit(`sub:${me.id}`, 10, 10_000)) return fail("Too many attempts.", 429);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid answer.", 400);

  const { data: st } = await supabaseAdmin
    .from("session_state")
    .select("phase, current_question_id, current_round, started_at, deadline, paused_remaining_ms, grace_ms, clincher_groups")
    .eq("id", 1)
    .single();
  if (!st || st.phase !== "QUESTION_LIVE" || !st.current_question_id || !st.started_at) {
    return fail("No question is open for answers.");
  }
  if (st.paused_remaining_ms != null || !st.deadline) return fail("The quiz is paused.");
  if (received > new Date(st.deadline).getTime() + st.grace_ms) return fail("Too late. Answer not accepted.");

  if (st.current_round === "CL") {
    const g = Array.isArray(st.clincher_groups) ? (st.clincher_groups as number[]) : [];
    if (!g.includes(me.group_id)) return fail("Your group is not in the clincher.", 403);
  }

  const { data: q } = await supabaseAdmin
    .from("questions")
    .select("id, input_mode, correct, accepted, tolerance, points")
    .eq("id", st.current_question_id)
    .single();
  if (!q) return fail("Question not found.", 500);

  const answer = sanitizeInput(q.input_mode, parsed.data.answer).trim();
  if (!answer) return fail("Type an answer first.", 400);

  const isCorrect = grade(q, answer);
  const elapsed = Math.max(0, received - new Date(st.started_at).getTime());

  const { error } = await supabaseAdmin.from("submissions").insert({
    group_id: me.group_id,
    question_id: q.id,
    participant_id: me.id,
    answer,
    is_correct: isCorrect,
    points_awarded: isCorrect ? q.points : 0,
    elapsed_ms: elapsed,
  });
  if (error) {
    if (error.code === "23505") return fail("Your group has already answered.");
    return fail("Could not save your answer.", 500);
  }
  // never tell the client whether it was correct before Reveal
  return NextResponse.json({ ok: true });
}