"use client";
import QuestionScreen from "@/components/QuestionScreen";
import RevealPanel from "@/components/RevealPanel";
import { Scoreboard, Podium } from "@/components/Scoreboard";
import { useQuizState } from "@/lib/useQuizState";
import { useResults } from "@/lib/useResults";

export default function BoardPage() {
  const { s, unauth, now } = useQuizState(true); // public view: never receives the answer early
  const { r } = useResults(s);

  if (unauth)
    return <main className="p-8 text-slate-400">Log in as Quiz Master in this browser first, then reopen /board.</main>;
  if (!s) return <main className="p-8 text-slate-400">Loading...</main>;

  if (["QUESTION_LIVE", "REVEALED"].includes(s.phase) && s.question) {
    return (
      <main className="min-h-screen space-y-6 p-6">
        <QuestionScreen s={s} now={now} />
        <RevealPanel r={r} questionId={s.question.id} myGroupId={null} />
        {s.phase === "REVEALED" && r?.standings && <Scoreboard rows={r.standings} title="Standings" />}
      </main>
    );
  }

  if (["ROUND_SCOREBOARD", "FINAL"].includes(s.phase) && r?.standings) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
        {s.phase === "FINAL" && <Podium rows={r.standings} />}
        <Scoreboard rows={r.standings} title={s.phase === "FINAL" ? "Final standings" : "Round scoreboard"} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm font-semibold tracking-widest text-amber-400">SLSU-DOST SA STEM QUIZ BEE</p>
      <h1 className="text-5xl font-extrabold">Battle of the Scholar Minds</h1>
      <p className="text-xl text-slate-400">
        {s.registered} registered · {s.groupsReady} of 6 groups ready
      </p>
    </main>
  );
}