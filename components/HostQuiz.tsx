"use client";
import { useCallback, useEffect, useState } from "react";
import { useQuizState } from "@/lib/useQuizState";
import QuestionScreen from "@/components/QuestionScreen";
import { useResults } from "@/lib/useResults";
import RevealPanel from "@/components/RevealPanel";
import { Scoreboard, Podium } from "@/components/Scoreboard";
import { sfx } from "@/lib/sound";

const HAZARD =
  "repeating-linear-gradient(-45deg, #B4232A 0 14px, #FFC93C 14px 28px)";

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
        else if (action === "start" || action === "start_clincher") sfx.start();
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
      : { label: tied.length ? "Finish → Final Results" : "Finish", run: () => act("finish") };

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
    <section className="glass space-y-5 text-navy" style={{ border: "2px solid #E0A100" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Live control</p>
          <h2 className="font-display text-4xl uppercase tracking-wide text-navy-deep">Quiz Control</h2>
        </div>
        <span className="rounded-full bg-navy px-4 py-1.5 font-display text-lg tracking-widest text-white">
          {ph}
          {paused ? " (PAUSED)" : ""}
        </span>
      </div>

      {primary && (
        <button
          disabled={busy}
          onClick={primary.run}
          className="btn-gold w-full !min-h-28 !rounded-2xl !py-8 !text-4xl md:!text-5xl"
        >
          {primary.label}{" "}
          <span className="font-sans text-lg font-bold normal-case tracking-normal opacity-80">(Space)</span>
        </button>
      )}

      {live && (
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={busy} onClick={() => act(paused ? "resume" : "pause")} className="btn-ghost">
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
          <button disabled={busy} onClick={() => act("add_time", 15)} className="btn-ghost">
            +15 s
          </button>
          <button disabled={busy} onClick={() => act("add_time", 30)} className="btn-ghost">
            +30 s
          </button>
          <span className="self-center text-sm font-semibold text-mute">
            Shortcuts: Space = next · R = reveal · S = scoreboard
          </span>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-2xl border-2 border-red-300 bg-red-50 p-3 font-semibold text-red-800">
          {error}
        </p>
      )}

      {/* no `sound` prop: the host panel stays silent, the projector board plays the timer sounds */}
      {q && s && ["QUESTION_LIVE", "LOCKED", "REVEALED"].includes(s.phase) && (
        <QuestionScreen s={s} now={now} small />
      )}

      {q?.correct && ["QUESTION_LIVE", "LOCKED", "REVEALED"].includes(s.phase) && (
        <div className="rounded-2xl p-[6px]" style={{ background: HAZARD }}>
          <div className="rounded-xl bg-white p-4">
            <div className="inline-block rounded-full bg-[#B4232A] px-3 py-1 font-display text-sm tracking-[.18em] text-white">
              QM ONLY. Do not share this screen.
            </div>
            <div className="mt-2 font-display text-4xl uppercase tracking-wide text-navy-deep md:text-5xl">
              {q.correct}
            </div>
            {q.accepted && q.accepted.length > 0 && (
              <div className="mt-1 font-semibold text-mute">Accepted: {q.accepted.join(" | ")}</div>
            )}
          </div>
        </div>
      )}

      {q && ph === "REVEALED" && <RevealPanel r={r} questionId={q.id} myGroupId={null} showOverlay={false} />}

      {ph === "REVEALED" && inClincher && (
        <div className="space-y-3">
          {r?.standings && <Scoreboard rows={r.standings} title="Current standings" />}
          {tied.length > 0 && (
            <p className="font-bold text-[#6B4700]">Still tied: Group {tied.join(", ")}.</p>
          )}
          <button disabled={busy} onClick={() => act("end_clincher")} className="btn-primary w-full">
            End Clincher → Final Results
          </button>
        </div>
      )}

      {ph === "ROUND_SCOREBOARD" && r?.standings && (
        <>
          <Scoreboard rows={r.standings} title="Round scoreboard" />
          {lastOverall && tied.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-gold bg-[#FFF3C7] p-3">
              <p className="font-bold text-[#6B4700]">
                Tie for a prize position: Group {tied.join(", ")}. A clincher is optional.
              </p>
              <button disabled={busy} onClick={() => act("start_clincher")} className="btn-gold">
                Start Clincher (optional)
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
            <button disabled={busy} onClick={() => act("start_clincher")} className="btn-gold">
              Still tied (Group {tied.join(", ")}): Start Clincher
            </button>
          )}
        </>
      )}

      <button
        onClick={() => {
          if (confirm("Reset the quiz back to the lobby? Question order and all answers are cleared. Participants and groups are kept.")) act("reset_quiz");
        }}
        className="min-h-11 text-sm font-bold text-[#B4232A] underline"
      >
        Reset quiz (back to lobby)
      </button>
    </section>
  );
}