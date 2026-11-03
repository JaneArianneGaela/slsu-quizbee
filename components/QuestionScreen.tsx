"use client";
import { useEffect, useRef, useState } from "react";
import type { QuizState } from "@/lib/types";
import { sfx } from "@/lib/sound";

const ROUND_LABEL: Record<string, string> = {
  R1: "EASY",
  R2: "MODERATE",
  R3: "DIFFICULT",
  CL: "CLINCHER",
};

// per-letter tile colours (A blue, B gold, C green, D violet) — same as the HTML sample
const OPT_TILE = [
  "bg-ice text-royal",
  "bg-[#FFF1C2] text-[#8a5f00]",
  "bg-[#DDF6EA] text-[#0d7a4f]",
  "bg-[#EADFFF] text-[#6b3fd1]",
];

export function useRemaining(s: QuizState, now: () => number) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const tick = () => {
      if (s.pausedRemainingMs != null) return setMs(s.pausedRemainingMs);
      if (!s.deadlineMs) return setMs(0);
      setMs(Math.max(0, s.deadlineMs - now()));
    };
    tick();
    const t = setInterval(tick, 100);
    return () => clearInterval(t);
  }, [s.deadlineMs, s.pausedRemainingMs, now]);
  return ms;
}

export default function QuestionScreen({
  s,
  now,
  small = false,
  badge,
  sound = false,
}: {
  s: QuizState;
  now: () => number;
  small?: boolean;
  badge?: string;
  /** play timer sounds + alarm glow (use on the projector board only) */
  sound?: boolean;
}) {
  const q = s.question!;
  const ms = useRemaining(s, now);
  const secs = Math.ceil(ms / 1000);
  const paused = s.pausedRemainingMs != null;
  const revealed = s.phase === "REVEALED";
  const frac = ms / (q.timeLimitS * 1000);
  const urgent = !revealed && !paused && secs > 0 && secs <= 10;
  const ringColor =
    frac > 0.5 ? "var(--blue)" : frac > 0.2 ? "var(--gold)" : "var(--red)";
  const clock =
    secs >= 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : String(secs);
  const offset = 276.46 * (1 - Math.min(1, Math.max(0, frac)));

  // ---- sounds (board only) ----
  const lastQ = useRef<string>("");
  const seenTime = useRef(false); // avoids a false buzz before the first timer tick

  useEffect(() => {
    if (!sound) return;
    if (lastQ.current !== q.id) {
      lastQ.current = q.id;
      seenTime.current = false;
      sfx.start();
    }
  }, [q.id, sound]);

  useEffect(() => {
    if (!sound || revealed || paused) return;
    if (secs > 0) seenTime.current = true;
    if (!seenTime.current) return;
    if (secs === 0) sfx.buzz();
    else if (secs <= 10) sfx.beep();
    else if (secs % 5 === 0) sfx.tick();
  }, [secs, sound, revealed, paused]);

  // ---- alarm glow in the last 10 seconds ----
  useEffect(() => {
    document.body.classList.toggle("alarm", !!sound && urgent);
    return () => document.body.classList.remove("alarm");
  }, [sound, urgent]);

  return (
    <div className="flex w-full select-none flex-col items-center gap-5 text-center">
      {/* chips */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <span className="chip chip-round">
          {ROUND_LABEL[q.round] ?? q.round} · QUESTION {q.number}/{q.totalInRound}
        </span>
        <span className="chip chip-pts">{q.points} PTS</span>
        {badge && <span className="chip">{badge}</span>}
      </div>

      {/* timer ring */}
      {!revealed && (
        <div
          className="relative aspect-square"
          style={{
            width: small ? "min(220px, 60vw)" : "min(46vh, 80vw)",
            ["--c" as string]: ringColor,
            animation: urgent ? "urgent 1s ease-in-out infinite" : undefined,
          }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="50" cy="50" r="44" fill="none" strokeWidth="9" stroke="#1D6FE81a" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              stroke="var(--c)"
              strokeDasharray="276.46"
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 1s linear, stroke .5s",
                filter: "drop-shadow(0 0 7px var(--c))",
              }}
            />
          </svg>
          <b
            className="absolute inset-0 grid place-items-center font-display font-normal leading-none tabular-nums text-[color:var(--c)]"
            style={{
              fontSize: small ? "clamp(2.8rem, 9vw, 4.4rem)" : "clamp(4.5rem, 16vh, 11rem)",
              textShadow: urgent ? "0 0 24px #E5484D88" : undefined,
            }}
          >
            {clock}
          </b>
        </div>
      )}
      {!revealed && paused && (
        <div className="font-display text-3xl uppercase tracking-[.14em] text-gold">⏸ PAUSED</div>
      )}
      {!revealed && !paused && ms === 0 && (
        <div className="font-display text-2xl uppercase tracking-[.1em] text-danger md:text-3xl">
          TIME&apos;S UP — waiting for the Quiz Master
        </div>
      )}

      {/* question card */}
      <p
        className={`w-full max-w-5xl rounded-2xl border border-line border-l-[7px] border-l-royal bg-gradient-to-br from-[#F2F8FF] to-white px-6 py-6 text-left font-bold leading-[1.3] tracking-[-.01em] text-navy shadow-[0_10px_30px_#1D6FE818] ${
          small ? "text-xl" : "text-3xl md:text-5xl"
        }`}
      >
        {q.prompt}
      </p>

      {/* options */}
      {q.options && (
        <div className="grid w-full max-w-5xl gap-3.5 md:grid-cols-2">
          {Object.entries(q.options).map(([k, v], i) => {
            const isCorrect = revealed && q.correct === k;
            const dim = revealed && q.correct !== k;
            return (
              <div
                key={k}
                className={`flex items-center gap-3.5 rounded-2xl border-2 p-4 text-left font-semibold text-navy transition ${
                  small ? "text-lg" : "text-2xl md:text-3xl"
                } ${
                  isCorrect
                    ? "border-ok bg-[#E6F8EF] shadow-[0_0_0_5px_#16A36A22,0_10px_30px_#16A36A33]"
                    : "border-line bg-white"
                } ${dim ? "opacity-40 saturate-[.4]" : ""}`}
              >
                <span
                  className={`grid h-11 w-11 flex-none place-items-center rounded-xl font-display text-2xl font-normal ${
                    isCorrect ? "bg-ok text-white" : OPT_TILE[i % 4]
                  }`}
                >
                  {k}
                </span>
                {v}
              </div>
            );
          })}
        </div>
      )}

      {/* reveal */}
      {revealed && (
        <div className="rounded-2xl border-2 border-ok bg-[#E6F8EF] px-10 py-6 shadow-[0_0_0_5px_#16A36A22,0_10px_30px_#16A36A33]">
          <div className="font-display text-sm uppercase tracking-[.18em] text-[#0d7a4f]">
            CORRECT ANSWER
          </div>
          <div className="font-display text-5xl font-normal uppercase tracking-[.06em] text-navy md:text-7xl">
            {q.correct}
          </div>
        </div>
      )}
    </div>
  );
}