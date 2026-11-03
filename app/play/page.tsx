"use client";
import { useEffect, useRef, useState } from "react";
import Wheel from "@/components/Wheel";
import QuestionScreen from "@/components/QuestionScreen";
import { useQuizState } from "@/lib/useQuizState";

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">{children}</main>;
}

export default function PlayPage() {
  const { s, unauth, now, load } = useQuizState();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const checked = useRef<string | null>(null);

  useEffect(() => {
    if (unauth) window.location.href = "/register";
  }, [unauth]);

  // play the personal wheel once per spin
  useEffect(() => {
    if (!s?.me?.groupId || !s.spinAt || !["ROLES", "LOBBY"].includes(s.phase)) return;
    if (checked.current === s.spinAt) return;
    checked.current = s.spinAt;
    if (sessionStorage.getItem(`spun:${s.spinAt}`)) return;
    setIntro(true);
    setSpinKey(1);
  }, [s]);

  function endIntro() {
    if (s?.spinAt) sessionStorage.setItem(`spun:${s.spinAt}`, "1");
    setIntro(false);
  }

  async function chooseRole(role: "VIEWER" | "ANSWERER") {
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setError(d.error ?? "Could not save your role.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
      load();
    }
  }

  if (!s) return <main className="p-8 text-slate-400">Loading...</main>;
  const me = s.me;
  if (!me) return <main className="p-8 text-slate-400">Sign in as a participant to play.</main>;

  const myGroup = s.groups.find((g) => g.id === me.groupId);
  const badge = myGroup ? `${myGroup.label} · ${me.role ?? "—"}` : undefined;

  // ---- live question / reveal ----
  if (["QUESTION_LIVE", "REVEALED"].includes(s.phase) && s.question) {
    return (
      <main className="min-h-screen p-6">
        <QuestionScreen s={s} now={now} badge={badge} />
      </main>
    );
  }

  if (s.phase === "REGISTRATION" || s.phase === "GROUPING") {
    return (
      <Shell>
        <div className="my-auto text-center">
          <h1 className="text-3xl font-bold">Hi, {me.fullName}!</h1>
          <p className="mt-3 text-xl text-slate-400">
            {s.phase === "REGISTRATION"
              ? "You're registered. Waiting for the Quiz Master to close registration..."
              : "Registration is closed. Waiting for the Quiz Master to spin the wheel..."}
          </p>
          <div className="mt-8 animate-pulse text-slate-500">{s.registered} registered so far</div>
        </div>
      </Shell>
    );
  }

  if (intro && me.groupId) {
    return (
      <Shell>
        <div className="my-auto flex flex-col items-center gap-8">
          <h1 className="text-3xl font-bold">Spinning for {me.fullName}...</h1>
          <Wheel target={me.groupId} spinKey={spinKey} durationMs={4000} size={320} />
          <div className="text-center" style={{ opacity: 0, animation: "fadeIn .5s ease forwards", animationDelay: "4s" }}>
            <div className="text-5xl font-extrabold text-amber-400">GROUP {me.groupId}</div>
            <button onClick={endIntro} className="mt-5 rounded-xl bg-emerald-500 px-8 py-3 text-xl font-bold text-slate-950">
              Continue
            </button>
          </div>
          <button onClick={endIntro} className="text-slate-500 underline">
            Skip
          </button>
        </div>
      </Shell>
    );
  }

  if (!["ROLES", "LOBBY"].includes(s.phase)) {
    return (
      <Shell>
        <div className="my-auto text-center">
          <h1 className="text-3xl font-bold">
            {s.phase === "FINAL" ? "The quiz is finished" : "Get ready..."}
          </h1>
          <p className="mt-3 text-slate-400">
            {s.phase === "ROUND_SCOREBOARD"
              ? "Round scoreboard coming up (built in Stage 4B)."
              : "Waiting for the next question."}
          </p>
        </div>
      </Shell>
    );
  }

  const answerer = myGroup?.members.find((m) => m.role === "ANSWERER");
  const taken = !!answerer && answerer.id !== me.id;

  return (
    <Shell>
      <header>
        <p className="text-slate-400">
          {me.fullName} · {me.college}
        </p>
        <h1 className="text-4xl font-extrabold" style={{ color: myGroup?.color }}>
          {myGroup?.label ?? "No group yet"}
        </h1>
      </header>

      {!me.role ? (
        <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Choose your role</h2>
          <p className="text-slate-400">
            Each group has exactly one Answerer, the only person who types the group&apos;s answer. Everyone else is a
            Viewer and answers by speaking in Google Meet.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              disabled={busy || taken}
              onClick={() => chooseRole("ANSWERER")}
              className="rounded-xl bg-amber-400 p-6 text-2xl font-bold text-slate-950 disabled:opacity-40"
            >
              Answerer
              {taken && <div className="text-sm font-normal">Taken by {answerer?.name}</div>}
            </button>
            <button
              disabled={busy}
              onClick={() => chooseRole("VIEWER")}
              className="rounded-xl bg-slate-700 p-6 text-2xl font-bold disabled:opacity-40"
            >
              Viewer
            </button>
          </div>
          {error && <p className="rounded-lg border border-red-800 bg-red-950 p-3 text-red-300">{error}</p>}
        </section>
      ) : (
        <section className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center">
          <div className="animate-pulse text-2xl font-bold">Waiting for the Quiz Master to start the quiz...</div>
          <p className="text-slate-300">
            You are the <span className="font-bold text-amber-400">{me.role}</span> of {myGroup?.label}.
          </p>
          <p className="text-slate-400">{s.groupsReady} of 6 groups ready</p>
          <button
            onClick={() => chooseRole(me.role === "ANSWERER" ? "VIEWER" : "ANSWERER")}
            disabled={busy || (me.role === "VIEWER" && taken)}
            className="text-sm text-slate-500 underline disabled:opacity-40"
          >
            Change role
          </button>
          {error && <p className="text-red-400">{error}</p>}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {s.groups.map((g) => (
          <div
            key={g.id}
            className={`overflow-hidden rounded-xl border bg-slate-900 ${g.id === me.groupId ? "border-white" : "border-slate-700"}`}
          >
            <div className="px-4 py-2 font-bold text-slate-950" style={{ background: g.color }}>
              {g.label}
            </div>
            <ul className="divide-y divide-slate-800">
              {g.members.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>
                    {m.name} <span className="text-slate-500">({m.college})</span>
                  </span>
                  {m.role === "ANSWERER" && <span className="text-xs font-bold text-amber-400">ANSWERER</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </Shell>
  );
}