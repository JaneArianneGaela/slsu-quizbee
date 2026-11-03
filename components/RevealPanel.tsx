"use client";
import { useEffect, useRef, useState } from "react";
import type { ResultsData } from "@/lib/useResults";

const ord = (n: number) => (n === 1 ? "1ST" : n === 2 ? "2ND" : n === 3 ? "3RD" : `${n}TH`);

export default function RevealPanel({
  r, questionId, myGroupId, showOverlay = true,
}: {
  r: ResultsData | null;
  questionId: string;
  myGroupId: number | null;
  showOverlay?: boolean;
}) {
  const reveal = r && r.questionId === questionId ? r.reveal : null;
  const hasReveal = !!reveal;
  const [overlay, setOverlay] = useState(false);
  const shown = useRef<string | null>(null);

  useEffect(() => {
    if (!showOverlay || !hasReveal || shown.current === questionId) return;
    shown.current = questionId;
    setOverlay(true);
    const t = setTimeout(() => setOverlay(false), 5000);
    return () => clearTimeout(t);
  }, [hasReveal, questionId, showOverlay]);

  if (!reveal) return null;
  const ranked = reveal.groups.filter((g) => g.place).sort((a, b) => a.place! - b.place!);
  const mine = reveal.groups.find((g) => g.groupId === myGroupId);

  return (
    <>
      {overlay && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-slate-950/95 p-6">
          <h2 className="text-4xl font-extrabold text-amber-400">RESULTS</h2>
          {ranked.length === 0 ? (
            <p className="text-3xl font-bold text-slate-300">No group got it right.</p>
          ) : (
            <ul className="w-full max-w-xl space-y-3">
              {ranked.map((g) => (
                <li
                  key={g.groupId}
                  className="flex items-center justify-between rounded-xl px-6 py-4 text-2xl font-extrabold text-slate-950"
                  style={{ background: g.color }}
                >
                  <span>{ord(g.place!)}</span>
                  <span>{g.label}</span>
                  <span>+{g.points}</span>
                </li>
              ))}
            </ul>
          )}
          {mine && (
            <p className="text-2xl font-bold">
              {mine.correct && mine.place
                ? `Your group: ${ord(mine.place)} · +${mine.points} pts`
                : mine.answered
                ? "Your group: not correct this time"
                : "Your group did not answer"}
            </p>
          )}
        </div>
      )}

      <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 md:grid-cols-6">
        {reveal.groups.map((g) => (
          <div
            key={g.groupId}
            className="rounded-xl border-2 p-3 text-center"
            style={{ borderColor: g.color }}
          >
            <div className="text-sm font-bold" style={{ color: g.color }}>{g.label}</div>
            <div className="text-3xl">{!g.answered ? "—" : g.correct ? "✓" : "✗"}</div>
            <div className="truncate text-sm text-slate-400">{g.answer ?? "no answer"}</div>
            {g.correct && <div className="font-bold text-emerald-400">+{g.points}</div>}
          </div>
        ))}
      </div>
    </>
  );
}