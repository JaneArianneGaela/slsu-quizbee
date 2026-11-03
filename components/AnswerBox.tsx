"use client";
import { useEffect, useRef, useState } from "react";
import type { QuizState } from "@/lib/types";
import { sanitizeInput, MAX_LEN } from "@/lib/grade";
import { useRemaining } from "@/components/QuestionScreen";
import { sfx } from "@/lib/sound";

const OPT_TILE = [
  "bg-ice text-royal",
  "bg-[#FFF1C2] text-[#8a5f00]",
  "bg-[#DDF6EA] text-[#0d7a4f]",
  "bg-[#EADFFF] text-[#6b3fd1]",
];

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
    if (sent || paused || !draft || autoTried.current) return;
    if (left <= 200) {
      autoTried.current = true;
      send(draft);
    }
  });

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-navy p-6 text-center shadow-[inset_0_0_30px_#29C4FF22,0_8px_24px_#0A2A6B44]">
        <div className="font-display text-sm uppercase tracking-[.2em] text-ok">
          <span className="rounded-full bg-[#E6F8EF] px-3 py-1">✓ ANSWER LOCKED</span>
        </div>
        <div className="mt-3 break-words font-display text-4xl font-normal uppercase tracking-[.1em] text-aqua md:text-5xl">
          {sent}
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

  const isChoice = q.inputMode === "CHOICE";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3.5">
      {isChoice ? (
        <>
          <div className="grid grid-cols-4 gap-3">
            {Object.keys(q.options ?? { A: "", B: "", C: "", D: "" }).map((k, i) => {
              const on = draft === k;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    sfx.select();
                    setDraft(k);
                  }}
                  className={`grid min-h-[84px] place-items-center rounded-2xl border-2 font-display text-4xl font-normal transition active:scale-[.97] ${
                    on
                      ? "-translate-y-0.5 border-royal bg-[#F2F8FF] text-royal shadow-[0_0_0_5px_#1D6FE822,0_10px_30px_#1D6FE833]"
                      : `border-line bg-white hover:-translate-y-0.5 hover:border-aqua hover:shadow-[0_10px_26px_#1D6FE82a] ${OPT_TILE[i % 4].split(" ")[1]}`
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>
          <div className="flex min-h-[72px] items-center justify-center gap-1 rounded-2xl bg-navy p-4 font-display text-4xl font-normal tracking-[.12em] text-aqua shadow-[inset_0_0_30px_#29C4FF22,0_8px_24px_#0A2A6B44]">
            {draft || <span className="text-aqua/40">PICK AN ANSWER</span>}
            <u className="h-9 w-3 bg-aqua no-underline" style={{ animation: "blink 1s steps(1) infinite" }} />
          </div>
        </>
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
          aria-label="Your answer"
          onChange={(e) => setDraft(sanitizeInput(q.inputMode, e.target.value))}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(draft);
          }}
          className="w-full rounded-2xl border-2 border-aqua bg-navy px-6 py-5 text-center font-display text-3xl font-normal uppercase tracking-[.12em] text-aqua shadow-[inset_0_0_30px_#29C4FF22,0_8px_24px_#0A2A6B44] outline-none transition placeholder:text-aqua/40 focus:shadow-[0_0_0_5px_#29C4FF33,inset_0_0_30px_#29C4FF22]"
        />
      )}

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