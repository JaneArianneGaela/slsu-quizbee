import { getStandings, firstTie } from "@/lib/standings";
import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { isQm } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

const Body = z.object({
  action: z.enum(["start", "reveal", "pause", "resume", "add_time", "scoreboard", "finish", "reset_quiz", "start_clincher", "end_clincher"]),
  seconds: z.number().int().min(1).max(300).optional(),
});

const roundOf = (id: string) => id.split("-")[0];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: Request) {
  if (!(await isQm())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  const { action, seconds } = parsed.data;

  const { data: st } = await supabaseAdmin.from("session_state").select("*").eq("id", 1).single();
  if (!st) return NextResponse.json({ error: "Server not ready." }, { status: 500 });

  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const fail = (m: string, code = 409) => NextResponse.json({ error: m }, { status: code });

  // Atomic: only applies if the phase has not changed since we read it (blocks double-presses).
  async function move(patch: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from("session_state")
      .update({ ...patch, updated_at: iso(now) })
      .eq("id", 1)
      .eq("phase", st.phase)
      .select("id");
    if (error) return fail("Update failed.", 500);
    if (!data?.length) return fail("The state just changed. Check the screen and try again.");
    return NextResponse.json({ ok: true });
  }

  async function getOrder(): Promise<string[]> {
    const { data } = await supabaseAdmin.from("quiz_order").select("order_ids").eq("id", 1).maybeSingle();
    return Array.isArray(data?.order_ids) ? (data!.order_ids as string[]) : [];
  }

  async function startAt(order: string[], index: number, extra: Record<string, unknown> = {}) {
    const id = order[index];
    const { data: q } = await supabaseAdmin.from("questions").select("id, time_limit_s").eq("id", id).single();
    if (!q) return fail("Question not found. Re-run npm run seed.", 500);
    return move({
      phase: "QUESTION_LIVE",
      current_index: index,
      current_question_id: id,
      current_round: roundOf(id),
      started_at: iso(now),
      deadline: iso(now + q.time_limit_s * 1000),
      paused_remaining_ms: null,
      revealed: false,
      ...extra,
    });
  }

  switch (action) {
    case "start": {
      if (st.phase === "LOBBY") {
        // shuffle ONCE per session, on the server, per round
        const { data: qs } = await supabaseAdmin
          .from("questions")
          .select("id, round")
          .in("round", ["R1", "R2", "R3"]);
        const ids = ["R1", "R2", "R3"].flatMap((r) =>
          shuffle((qs ?? []).filter((q) => q.round === r).map((q) => q.id))
        );
        if (!ids.length) return fail("No questions found. Run npm run seed.", 500);
        const { error } = await supabaseAdmin.from("quiz_order").upsert({ id: 1, order_ids: ids });
        if (error) return fail("Could not save the question order.", 500);
        return startAt(ids, 0);
      }
      if (st.phase === "REVEALED" || st.phase === "ROUND_SCOREBOARD") {
        const order = await getOrder();
        const next = st.current_index + 1;
        if (next >= order.length) return fail("No more questions. Show the scoreboard, then Finish.");
        if (st.phase === "REVEALED" && roundOf(order[next]) !== roundOf(order[st.current_index])) {
          return fail("That was the last question of the round. Press Show Round Scoreboard.");
        }
        return startAt(order, next);
      }
      return fail("You can't start a question right now.");
    }

    case "reveal": {
      if (st.phase !== "QUESTION_LIVE") return fail("No live question to reveal.");
      return move({ phase: "REVEALED", revealed: true, paused_remaining_ms: null });
    }

    case "pause": {
      if (st.phase !== "QUESTION_LIVE" || st.paused_remaining_ms != null || !st.deadline) {
        return fail("Nothing to pause.");
      }
      const remaining = Math.max(0, new Date(st.deadline).getTime() - now);
      return move({ paused_remaining_ms: remaining, deadline: null });
    }

    case "resume": {
      if (st.phase !== "QUESTION_LIVE" || st.paused_remaining_ms == null) return fail("Not paused.");
      return move({ deadline: iso(now + st.paused_remaining_ms), paused_remaining_ms: null });
    }

    case "add_time": {
      if (st.phase !== "QUESTION_LIVE") return fail("Time can only be added to a live question.");
      const add = (seconds ?? 15) * 1000;
      if (st.paused_remaining_ms != null) return move({ paused_remaining_ms: st.paused_remaining_ms + add });
      const base = Math.max(new Date(st.deadline).getTime(), now);
      return move({ deadline: iso(base + add) });
    }

    case "scoreboard": {
      if (st.phase !== "REVEALED") return fail("Reveal the answer first.");
      const order = await getOrder();
      const next = st.current_index + 1;
      const endOfRound = next >= order.length || roundOf(order[next]) !== roundOf(order[st.current_index]);
      if (!endOfRound) return fail("The round still has questions left.");
      return move({ phase: "ROUND_SCOREBOARD" });
    }

    case "finish": {
      if (st.phase !== "ROUND_SCOREBOARD") return fail("Finish from the round scoreboard.");
      const order = await getOrder();
      if (st.current_index + 1 < order.length) return fail("There are still rounds to play.");
      if (firstTie(await getStandings()).length) return fail("Resolve the tie with a clincher before finishing.");
      return move({ phase: "FINAL" });
    }

    case "start_clincher": {
      const fromScoreboard = st.phase === "ROUND_SCOREBOARD" || st.phase === "FINAL";
      const fromClincher = st.phase === "REVEALED" && st.current_round === "CL";
      if (!fromScoreboard && !fromClincher) return fail("Start the clincher from the final scoreboard.");
      const order = await getOrder();
      if (fromScoreboard && st.current_index + 1 < order.length) return fail("Finish the regular rounds first.");

      const tied = firstTie(await getStandings());
      if (!tied.length) return fail("No tie to break.");

      const { data: cl } = await supabaseAdmin.from("questions").select("id").eq("round", "CL").order("order_no");
      const next = (cl ?? []).map((q) => q.id).find((id) => !order.includes(id));
      if (!next) return fail("No clincher questions left.");

      const newOrder = [...order, next];
      const { error } = await supabaseAdmin.from("quiz_order").upsert({ id: 1, order_ids: newOrder });
      if (error) return fail("Could not save the clincher order.", 500);
      return startAt(newOrder, newOrder.length - 1, {
        clincher_groups: tied,
        clincher_winner_group_id: null,
      });
    }

    case "end_clincher": {
      if (st.phase !== "REVEALED" || st.current_round !== "CL") return fail("Not in a clincher.");
      const tied = firstTie(await getStandings());
      if (tied.length) {
        const order = await getOrder();
        const { data: clinchers } = await supabaseAdmin
          .from("questions")
          .select("id")
          .eq("round", "CL");
        const hasMoreQuestions = (clinchers ?? []).some((q) => !order.includes(q.id));
        if (hasMoreQuestions) return fail("Continue the clincher until a group answers correctly.");
      }
      return move({ phase: "FINAL" });
    }

    case "reset_quiz": {
      if (["REGISTRATION", "GROUPING", "ROLES"].includes(st.phase)) return fail("The quiz hasn't started yet.");
      await supabaseAdmin.from("submissions").delete().not("id", "is", null);
      await supabaseAdmin.from("quiz_order").delete().eq("id", 1);
      const { error } = await supabaseAdmin
        .from("session_state")
        .update({
          phase: "LOBBY",
          current_index: -1,
          current_question_id: null,
          current_round: null,
          started_at: null,
          deadline: null,
          paused_remaining_ms: null,
          revealed: false,
          updated_at: iso(now),
          clincher_groups: null,
          clincher_winner_group_id: null,
        })
        .eq("id", 1);
      if (error) return fail("Reset failed.", 500);
      return NextResponse.json({ ok: true });
    }
  }
}