"use client";
import { useEffect, useState } from "react";
import type { QuizState } from "@/lib/types";

const ROUND_LABEL: Record<string, string> = {
  R1: "EASY",
  R2: "MODERATE",
  R3: "DIFFICULT",
  CL: "CLINCHER",
};

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
}: {
  s: QuizState;
  now: () => number;
  small?: boolean;
  badge?: string;
}) {
  const q = s.question!;
  const ms = useRemaining(s, now);
  const secs = Math.ceil(ms / 1000);
  const paused = s.pausedRemainingMs != null;
  const revealed = s.phase === "REVEALED";
  const frac = ms / (q.timeLimitS * 1000);
  const urgent = !revealed && !paused && secs > 0 && secs <= 10;
  const color =
    frac > 0.5 ? "text-emerald-400" : frac > 0.2 ? "text-amber-400" : "text-red-500";
  const clock =
    secs >= 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : String(secs);

  return (
    <div className="flex w-full select-none flex-col items-center gap-5 text-center">
      <div className="flex flex-wrap items-center justify-center gap-3 text-lg font-semibold text-slate-300">
        <span className="rounded-full bg-slate-800 px-4 py-1">
          {ROUND_LABEL[q.round] ?? q.round} · QUESTION {q.number}/{q.totalInRound}
        </span>
        <span className="rounded-full bg-amber-400 px-4 py-1 text-slate-950">{q.points} PTS</span>
        {badge && <span className="rounded-full bg-slate-800 px-4 py-1">{badge}</span>}
      </div>

      {!revealed && (
        <div
          className={`font-extrabold leading-none tabular-nums ${color}`}
          style={{
            fontSize: small ? "clamp(3.5rem, 10vw, 7rem)" : "clamp(7rem, 30vh, 22rem)",
            animation: urgent ? "urgent 1s ease-in-out infinite" : undefined,
          }}
        >
          {clock}
        </div>
      )}
      {!revealed && paused && <div className="text-3xl font-bold text-amber-400">⏸ PAUSED</div>}
      {!revealed && !paused && ms === 0 && (
        <div className="text-3xl font-bold text-red-500">TIME&apos;S UP — waiting for the Quiz Master</div>
      )}

      <p className={`max-w-5xl font-semibold ${small ? "text-xl" : "text-3xl md:text-4xl"}`}>{q.prompt}</p>

      {q.options && (
        <div className="grid w-full max-w-4xl gap-3 md:grid-cols-2">
          {Object.entries(q.options).map(([k, v]) => (
            <div
              key={k}
              className={`rounded-xl border-2 p-4 text-left text-xl ${
                revealed && q.correct === k
                  ? "border-emerald-400 bg-emerald-950"
                  : "border-slate-700 bg-slate-900"
              }`}
            >
              <span className="mr-3 font-extrabold text-amber-400">{k}</span>
              {v}
            </div>
          ))}
        </div>
      )}

      {revealed && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-950 px-10 py-6">
          <div className="text-sm font-semibold text-emerald-300">CORRECT ANSWER</div>
          <div className="text-5xl font-extrabold">{q.correct}</div>
        </div>
      )}
    </div>
  );
}