"use client";
import QuestionScreen from "@/components/QuestionScreen";
import RevealPanel from "@/components/RevealPanel";
import { Scoreboard, Podium } from "@/components/Scoreboard";
import { BrandHeader, BrandTicker } from "@/components/BrandHeader";
import { useQuizState } from "@/lib/useQuizState";
import { useResults } from "@/lib/useResults";

const HEX = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";

function Hexes({ ready }: { ready: number }) {
  const n = Math.max(0, Math.min(6, ready));
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3" role="img" aria-label={`${n} of 6 groups ready`}>
        {Array.from({ length: 6 }).map((_, i) => {
          const on = i < n;
          return (
            <span
              key={i}
              className="relative inline-block h-[4.5rem] w-[4.5rem]"
              style={{
                clipPath: HEX,
                background: on ? "#B07C00" : "#1D6FE8",
                transition: "background .4s",
              }}
            >
              <span
                className="absolute inset-[4px] flex items-center justify-center font-display text-3xl"
                style={{
                  clipPath: HEX,
                  background: on ? "linear-gradient(135deg, #FFE08A, #FFC93C 55%, #E0A100)" : "#fff",
                  color: on ? "#061A4A" : "#50689A",
                  transition: "background .4s, color .4s",
                  animation: on ? "softPulse 2.4s ease-in-out infinite" : undefined,
                }}
              >
                {i + 1}
              </span>
            </span>
          );
        })}
      </div>
      <p className="font-display text-3xl uppercase tracking-[.2em] text-navy-deep">
        {n} of 6 groups ready
      </p>
    </div>
  );
}

function Frame({ children, lock = false }: { children: React.ReactNode; lock?: boolean }) {
  return (
    <div className={`flex min-h-dvh flex-col text-navy ${lock ? "h-dvh overflow-hidden" : ""}`}>
      <BrandHeader compact />
      {children}
    </div>
  );
}

export default function BoardPage() {
  const { s, unauth, now } = useQuizState(true); // public view: never receives the answer early
  const { r } = useResults(s);

  if (unauth)
    return (
      <Frame>
        <main className="grid flex-1 place-items-center p-8 text-center text-3xl font-semibold text-mute">
          Log in as Quiz Master in this browser first, then reopen /board.
        </main>
      </Frame>
    );
  if (!s)
    return (
      <Frame>
        <main className="grid flex-1 place-items-center p-8 font-display text-4xl uppercase tracking-[.2em] text-mute">
          Loading...
        </main>
      </Frame>
    );

  if (["QUESTION_LIVE", "REVEALED"].includes(s.phase) && s.question) {
    return (
      <Frame>
        <main className="mx-auto w-full max-w-[110rem] flex-1 space-y-6 px-8 py-5">
          <QuestionScreen s={s} now={now} />
          <RevealPanel r={r} questionId={s.question.id} myGroupId={null} />
          {s.phase === "REVEALED" && r?.standings && <Scoreboard rows={r.standings} title="Standings" />}
        </main>
      </Frame>
    );
  }

  if (["ROUND_SCOREBOARD", "FINAL"].includes(s.phase) && r?.standings) {
    return (
      <Frame>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-8 py-6">
          {s.phase === "FINAL" && <Podium rows={r.standings} />}
          <Scoreboard rows={r.standings} title={s.phase === "FINAL" ? "Final standings" : "Round scoreboard"} />
        </main>
      </Frame>
    );
  }

  return (
    <Frame lock>
      <BrandTicker />
      <main className="dotgrid relative flex min-h-0 flex-1 flex-col items-center justify-center gap-[2.2vh] px-8 text-center">
        <p className="eyebrow !text-2xl">SLSU-DOST SA STEM QUIZ BEE</p>
        <h1 className="display !my-0 !text-[clamp(3.5rem,9vh,7.5rem)] text-navy-deep">
          Battle of the <span className="hl">Scholar Minds</span>
        </h1>

        <div className="flex flex-col items-center">
          <div
            className="font-display leading-none tabular-nums"
            style={{
              fontSize: "clamp(7rem, 20vh, 13rem)",
              background: "linear-gradient(135deg, #1D6FE8, #0A2A6B)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
            aria-label={`${s.registered} registered`}
          >
            {s.registered}
          </div>
          <p className="font-display text-4xl uppercase tracking-[.3em] text-navy-deep">Registered</p>
        </div>

        <Hexes ready={s.groupsReady} />
      </main>
    </Frame>
  );
}