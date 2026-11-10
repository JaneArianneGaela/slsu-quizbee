"use client";
import { useEffect, useRef, useState } from "react";
import type { QuizState } from "@/lib/types";
import { sanitizeInput, MAX_LEN } from "@/lib/grade";
import { useRemaining } from "@/components/QuestionScreen";
import { sfx } from "@/lib/sound";

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
  const [sent, setSent] = useState<string | null>(null);
  const locked = sent ?? submitted;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inflight = useRef(false);
  const autoTried = useRef(false);

  async function send(value: string) {
    const v = value.trim();
    if (inflight.current || locked || !v) return;
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
        sfx.lock();
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
    if (locked || paused || !draft || autoTried.current) return;
    if (left <= 200) {
      autoTried.current = true;
      window.setTimeout(() => void send(draft), 0);
    }
  });

  if (locked) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-navy p-6 text-center shadow-[inset_0_0_30px_#29C4FF22,0_8px_24px_#0A2A6B44]">
        <div className="font-display text-sm uppercase tracking-[.2em] text-ok">
          <span className="rounded-full bg-[#E6F8EF] px-3 py-1">✓ ANSWER LOCKED</span>
        </div>
        <div className="mt-3 break-words font-display text-4xl font-normal uppercase tracking-[.1em] text-aqua md:text-5xl">
          {q.inputMode === "CHOICE" && q.options?.[locked] ? `${locked}. ${q.options[locked]}` : locked}
        </div>
      </div>
    );
  }
  if (closed) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-2xl border-2 border-danger bg-[#FDECEC] p-6 text-center font-display text-2xl uppercase tracking-[.08em] text-[#9B1C20]">
        Time&apos;s up. No answer was submitted.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3.5">
      <input
        autoFocus
        value={draft}
        maxLength={MAX_LEN}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode={q.inputMode === "NUMBER" || q.inputMode === "IPV4" ? "decimal" : "text"}
        placeholder={q.inputMode === "CHOICE" ? "TYPE THE OPTION LETTER" : "TYPE YOUR ANSWER"}
        aria-label="Your answer"
        onChange={(e) => setDraft(sanitizeInput(q.inputMode, e.target.value))}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Enter") send(draft);
        }}
        className="w-full rounded-2xl border-2 border-aqua bg-navy px-6 py-5 text-center font-display text-3xl font-normal uppercase tracking-[.12em] text-aqua shadow-[inset_0_0_30px_#29C4FF22,0_8px_24px_#0A2A6B44] outline-none transition placeholder:text-aqua/40 focus:shadow-[0_0_0_5px_#29C4FF33,inset_0_0_30px_#29C4FF22]"
      />

      <button
        disabled={busy || !draft}
        onClick={() => send(draft)}
        className="btn-primary w-full"
      >
        {busy ? "Sending..." : "🔒 Submit"}
      </button>

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-danger bg-[#FDECEC] p-3 font-semibold text-[#9B1C20]"
        >
          {error}
        </p>
      )}
    </div>
  );
}