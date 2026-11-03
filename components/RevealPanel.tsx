"use client";
import { useEffect, useRef, useState } from "react";
import type { ResultsData } from "@/lib/useResults";
import { sfx } from "@/lib/sound";

const ord = (n: number) => (n === 1 ? "1ST" : n === 2 ? "2ND" : n === 3 ? "3RD" : `${n}TH`);
const medalOf = (n: number) => (n === 1 ? "🥇" : n === 2 ? "🥈" : n === 3 ? "🥉" : "");

const css = `
@keyframes rp-in { from { opacity: 0; transform: translateY(28px) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes rp-pop { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: none; } }
@keyframes rp-glow { 50% { box-shadow: 0 0 0 5px var(--gc-ring), 0 0 44px var(--gc-glow); } }
.rp-in { animation: rp-in .6s cubic-bezier(.2,.8,.2,1) backwards; }
.rp-pop { animation: rp-pop .45s cubic-bezier(.2,.9,.3,1.2) backwards; }
.rp-chip {
  --gc-ring: color-mix(in srgb, var(--gc) 35%, transparent);
  --gc-glow: color-mix(in srgb, var(--gc) 55%, transparent);
  box-shadow: 0 0 0 3px var(--gc-ring), 0 10px 28px var(--gc-glow);
}
.rp-chip-hit { animation: rp-glow 2.4s ease-in-out infinite; }
`;

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
    sfx.correct();
    const t = setTimeout(() => setOverlay(false), 5000);
    return () => clearTimeout(t);
  }, [hasReveal, questionId, showOverlay]);

  if (!reveal) return null;
  const ranked = reveal.groups.filter((g) => g.place).sort((a, b) => a.place! - b.place!);
  const mine = reveal.groups.find((g) => g.groupId === myGroupId);
  const isTie = (p: number) => ranked.filter((x) => x.place === p).length > 1;

  return (
    <>
      <style>{css}</style>
      {overlay && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 p-6 text-white"
          style={{ background: "radial-gradient(ellipse at 50% 20%, #123C93f2, #061A4Afa 70%)" }}
          role="status"
          aria-live="polite"
        >
          <h2 className="rp-pop font-display text-6xl uppercase tracking-[.12em] text-gold-soft md:text-7xl">
            Results
          </h2>
          {ranked.length === 0 ? (
            <p className="rp-in rounded-2xl border-2 border-white/30 bg-white/10 px-8 py-6 text-center text-3xl font-bold md:text-4xl" style={{ animationDelay: "200ms" }}>
              No group got it right.
            </p>
          ) : (
            <ul className="w-full max-w-2xl space-y-3">
              {ranked.map((g, i) => (
                <li
                  key={g.groupId}
                  className="rp-in rp-chip flex items-center justify-between gap-4 rounded-2xl bg-white px-6 py-4 text-navy-deep"
                  style={{ ["--gc" as string]: g.color, animationDelay: `${200 + i * 160}ms`, borderLeft: `14px solid ${g.color}` } as React.CSSProperties}
                >
                  <span className="flex items-center gap-3 font-display text-3xl tracking-wider md:text-4xl">
                    <span aria-hidden>{medalOf(g.place!)}</span>
                    {ord(g.place!)}
                    {isTie(g.place!) && (
                      <span className="rounded-full bg-gold-soft px-3 py-1 text-sm tracking-widest">TIE</span>
                    )}
                  </span>
                  <span className="flex-1 truncate text-center text-2xl font-extrabold md:text-3xl">{g.label}</span>
                  <span className="font-display text-3xl tracking-wider text-[#0B7A4D] md:text-4xl">+{g.points}</span>
                </li>
              ))}
            </ul>
          )}
          {mine && (
            <p
              className="rp-in rounded-full border-2 border-gold-soft bg-white/10 px-6 py-3 text-center text-xl font-bold md:text-2xl"
              style={{ animationDelay: `${300 + ranked.length * 160}ms` }}
            >
              {mine.correct && mine.place
                ? `Your group: ${ord(mine.place)} · +${mine.points} pts`
                : mine.answered
                ? "Your group: not correct this time"
                : "Your group did not answer"}
            </p>
          )}
        </div>
      )}

      <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-4 p-1 md:grid-cols-6">
        {reveal.groups.map((g, i) => (
          <div
            key={g.groupId}
            className={`rp-in rp-chip ${g.correct ? "rp-chip-hit" : ""} rounded-2xl bg-white p-3 text-center text-navy`}
            style={{ ["--gc" as string]: g.color, animationDelay: `${i * 80}ms`, borderTop: `8px solid ${g.color}` } as React.CSSProperties}
          >
            <div className="font-display text-lg uppercase tracking-widest text-navy-deep">{g.label}</div>
            <div
              className="text-4xl font-black"
              style={{ color: !g.answered ? "#50689A" : g.correct ? "#16A36A" : "#E5484D" }}
              aria-label={!g.answered ? "No answer" : g.correct ? "Correct" : "Incorrect"}
            >
              {!g.answered ? "—" : g.correct ? "✓" : "✗"}
            </div>
            <div className="truncate text-sm font-medium text-mute">{g.answer ?? "no answer"}</div>
            {g.correct && <div className="text-xl font-extrabold text-[#0B7A4D]">+{g.points}</div>}
          </div>
        ))}
      </div>
    </>
  );
}