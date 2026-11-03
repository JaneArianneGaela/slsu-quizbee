"use client";
import { useCallback, useEffect, useState } from "react";
import { useQuizState } from "@/lib/useQuizState";
import QuestionScreen from "@/components/QuestionScreen";
import { useResults } from "@/lib/useResults";
import RevealPanel from "@/components/RevealPanel";
import { Scoreboard, Podium } from "@/components/Scoreboard";

export default function HostQuiz() {
  const { s, now, load } = useQuizState();
  const { r } = useResults(s);
  const tied = r?.tied ?? [];
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const act = useCallback(
    async (action: string, seconds?: number) => {
      setError("");
      setBusy(true);
      try {
        const res = await fetch("/api/host/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, seconds }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) setError(d.error ?? "Action failed.");
      } catch {
        setError("Network error.");
      } finally {
        setBusy(false);
        load();
      }
    },
    [load]
  );

  const ph = s?.effectivePhase ?? "";
  const q = s?.question ?? null;
  const live = ph === "QUESTION_LIVE" || ph === "LOCKED";
  const inClincher = q?.round === "CL";
  const lastOfRound = !!q && !inClincher && q.number === q.totalInRound;
  const lastOverall = !!s && s.index + 1 >= s.totalQuestions;
  const paused = s?.pausedRemainingMs != null;

  const reveal = useCallback(() => {
    if (ph === "QUESTION_LIVE" && !confirm("The timer is still running. Reveal now?")) return;
    act("reveal");
  }, [ph, act]);

  let primary: { label: string; run: () => void } | null = null;
  if (ph === "LOBBY") primary = { label: "Start Question 1", run: () => act("start") };
  else if (live) primary = { label: "Reveal Answer", run: reveal };
  else if (ph === "REVEALED" && inClincher)
    primary = tied.length
      ? { label: "Next Clincher Question", run: () => act("start_clincher") }
      : { label: "End Clincher → Final Podium", run: () => act("end_clincher") };
  else if (ph === "REVEALED")
    primary = lastOfRound
      ? { label: "Show Round Scoreboard", run: () => act("scoreboard") }
      : { label: "Start Next Question", run: () => act("start") };
  else if (ph === "ROUND_SCOREBOARD")
    primary = !lastOverall
      ? { label: "Start Next Round", run: () => act("start") }
      : tied.length
      ? { label: "Start Clincher", run: () => act("start_clincher") }
      : { label: "Finish", run: () => act("finish") };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(t.tagName) || busy) return;
      if (e.code === "Space") {
        e.preventDefault();
        primary?.run();
      } else if (e.key.toLowerCase() === "r") {
        if (live) reveal();
      } else if (e.key.toLowerCase() === "s") {
        if (ph === "REVEALED" && lastOfRound) act("scoreboard");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!s || !s.isQm || ["REGISTRATION", "GROUPING", "ROLES"].includes(s.phase)) return null;

  return (
    <section className="space-y-4 rounded-2xl border border-amber-400/40 bg-slate-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Quiz Control</h2>
        <span className="font-semibold text-amber-400">
          {ph}
          {paused ? " (PAUSED)" : ""}
        </span>
      </div>

      {primary && (
        <button
          disabled={busy}
          onClick={primary.run}
          className="w-full rounded-2xl bg-amber-400 py-6 text-3xl font-extrabold text-slate-950 disabled:opacity-50"
        >
          {primary.label} <span className="text-base font-normal">(Space)</span>
        </button>
      )}

      {live && (
        <div className="flex flex-wrap gap-3">
          <button
            disabled={busy}
            onClick={() => act(paused ? "resume" : "pause")}
            className="rounded-lg border border-slate-600 px-5 py-2 font-semibold"
          >
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
          <button disabled={busy} onClick={() => act("add_time", 15)} className="rounded-lg border border-slate-600 px-5 py-2 font-semibold">
            +15 s
          </button>
          <button disabled={busy} onClick={() => act("add_time", 30)} className="rounded-lg border border-slate-600 px-5 py-2 font-semibold">
            +30 s
          </button>
          <span className="self-center text-sm text-slate-500">Shortcuts: Space = next · R = reveal · S = scoreboard</span>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-800 bg-red-950 p-3 text-red-300">{error}</p>}

      {q && s && <QuestionScreen s={s} now={now} small />}

      {q?.correct && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-400/10 p-4">
          <div className="text-sm font-semibold text-amber-400">QM ONLY · CORRECT ANSWER (don&apos;t share this screen)</div>
          <div className="text-3xl font-extrabold">{q.correct}</div>
          {q.accepted && q.accepted.length > 0 && (
            <div className="text-slate-400">Accepted: {q.accepted.join(" | ")}</div>
          )}
        </div>
      )}

      {q && ph === "REVEALED" && <RevealPanel r={r} questionId={q.id} myGroupId={null} showOverlay={false} />}

      {ph === "ROUND_SCOREBOARD" && r?.standings && (
        <>
          <Scoreboard rows={r.standings} title="Round scoreboard" />
          {lastOverall && tied.length > 0 && (
            <div className="flex items-center gap-3">
              <p className="text-amber-400">Tie for a prize position: Group {tied.join(", ")}.</p>
              <button disabled={busy} onClick={() => act("finish")} className="text-sm text-slate-400 underline">
                Skip clincher and finish
              </button>
            </div>
          )}
        </>
      )}
      {ph === "FINAL" && r?.standings && (
        <>
          <Podium rows={r.standings} />
          <Scoreboard rows={r.standings} title="Final standings" />
          {tied.length > 0 && (
            <button disabled={busy} onClick={() => act("start_clincher")} className="rounded-lg bg-amber-400 px-5 py-2 font-bold text-slate-950">
              Still tied (Group {tied.join(", ")}): Start Clincher
            </button>
          )}
        </>
      )}

      <button
        onClick={() => {
          if (confirm("Reset the quiz back to the lobby? Question order and all answers are cleared. Participants and groups are kept.")) act("reset_quiz");
        }}
        className="text-sm text-red-400 underline"
      >
        Reset quiz (back to lobby)
      </button>
    </section>
  );
}