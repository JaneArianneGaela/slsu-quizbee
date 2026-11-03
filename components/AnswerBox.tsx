"use client";
import { useEffect, useRef, useState } from "react";
import type { QuizState } from "@/lib/types";
import { sanitizeInput, MAX_LEN } from "@/lib/grade";
import { useRemaining } from "@/components/QuestionScreen";

export default function AnswerBox({
  s, now, submitted, onSent,
}: {
  s: QuizState;
  now: () => number;
  submitted: string | null;
  onSent: () => void;
}) {
  const q = s.question!;
  const ms = useRemaining(s, now); // re-renders every 100 ms
  void ms;
  const paused = s.pausedRemainingMs != null;
  const left = paused ? s.pausedRemainingMs! : Math.max(0, (s.deadlineMs ?? 0) - now());
  const closed = !paused && left <= 0;

  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string | null>(submitted);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inflight = useRef(false);
  const autoTried = useRef(false);

  useEffect(() => {
    if (submitted) setSent(submitted);
  }, [submitted]);

  async function send(value: string) {
    const v = value.trim();
    if (inflight.current || sent || !v) return;
    inflight.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: v }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok || (r.status === 409 && /already/i.test(d.error ?? ""))) {
        setSent(v);
        onSent();
      } else {
        setError(d.error ?? "Could not submit.");
      }
    } catch {
      setError("Network error. Press Submit again.");
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  }

  // auto-submit whatever is typed just before the deadline (once)
  useEffect(() => {
    if (sent || paused || !draft || autoTried.current) return;
    if (left <= 200) {
      autoTried.current = true;
      send(draft);
    }
  });

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-2xl border-2 border-emerald-400 bg-emerald-950 p-6 text-center">
        <div className="text-sm font-semibold text-emerald-300">ANSWER LOCKED</div>
        <div className="text-4xl font-extrabold">{sent}</div>
      </div>
    );
  }
  if (closed) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-red-800 bg-red-950 p-6 text-center text-xl font-bold text-red-300">
        Time&apos;s up. No answer was submitted.
      </div>
    );
  }

  const isChoice = q.inputMode === "CHOICE";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3">
      {isChoice ? (
        <div className="grid grid-cols-4 gap-3">
          {Object.keys(q.options ?? { A: "", B: "", C: "", D: "" }).map((k) => (
            <button
              key={k}
              onClick={() => setDraft(k)}
              className={`rounded-xl border-2 py-5 text-3xl font-extrabold ${
                draft === k ? "border-amber-400 bg-amber-400 text-slate-950" : "border-slate-600 bg-slate-900"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      ) : (
        <input
          autoFocus
          value={draft}
          maxLength={MAX_LEN}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode={q.inputMode === "NUMBER" || q.inputMode === "IPV4" ? "decimal" : "text"}
          placeholder="TYPE YOUR ANSWER"
          onChange={(e) => setDraft(sanitizeInput(q.inputMode, e.target.value))}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(draft);
          }}
          className="w-full rounded-2xl border-2 border-slate-600 bg-slate-900 px-6 py-5 text-center text-4xl font-extrabold tracking-wide outline-none focus:border-amber-400"
        />
      )}
      <button
        disabled={busy || !draft}
        onClick={() => send(draft)}
        className="w-full rounded-2xl bg-emerald-500 py-4 text-2xl font-extrabold text-slate-950 disabled:opacity-40"
      >
        {busy ? "Sending..." : "Submit"}
      </button>
      {error && <p className="rounded-lg border border-red-800 bg-red-950 p-3 text-red-300">{error}</p>}
    </div>
  );
}