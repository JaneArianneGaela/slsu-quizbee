"use client";
import { useEffect, useState } from "react";
import QuestionScreen from "@/components/QuestionScreen";
import AnswerBox from "@/components/AnswerBox";
import RevealPanel from "@/components/RevealPanel";
import { Scoreboard, Podium } from "@/components/Scoreboard";
import { useResults } from "@/lib/useResults";
import { useQuizState } from "@/lib/useQuizState";
import { sfx } from "@/lib/sound";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 py-5 text-navy md:max-w-5xl md:gap-6 md:py-8"
      style={{
        paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
        paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
        paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      {children}
    </main>
  );
}

const COLLEGES = ["CAG", "CAS", "CEN", "CIT", "CTE"] as const;
function CollegeBadge({ college }: { college: string }) {
  const up = (college ?? "").toUpperCase();
  const code = COLLEGES.find((c) => up.includes(c));
  const color = code ? `var(--${code.toLowerCase()})` : "var(--slsu)";
  return (
    <span
      aria-hidden
      className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1 text-[9px] font-extrabold leading-none tracking-wide text-white ring-2 ring-white"
      style={{ background: color, boxShadow: "0 1px 4px #0A2A6B44" }}
    >
      {code ?? "SLSU"}
    </span>
  );
}

export default function PlayPage() {
  const { s, unauth, now, load } = useQuizState();
  const { r, reload } = useResults(s);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (unauth) window.location.href = "/register";
  }, [unauth]);

  async function chooseRole(role: "VIEWER" | "ANSWERER") {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error ?? "Could not save your role.");
      else sfx.select();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
      load();
    }
  }

  if (!s)
    return (
      <main className="grid min-h-dvh place-items-center p-8 font-display text-2xl uppercase tracking-[.2em] text-mute">
        Loading...
      </main>
    );
  const me = s.me;
  if (!me)
    return (
      <main className="grid min-h-dvh place-items-center p-8 text-center text-xl font-semibold text-mute">
        Sign in as a participant to play.
      </main>
    );

  const myGroup = s.groups.find((g) => g.id === me.groupId);
  const badge = myGroup ? `${myGroup.label} · ${me.role ?? "—"}` : undefined;

  // ---- live question / reveal ----
  if (["QUESTION_LIVE", "REVEALED"].includes(s.phase) && s.question) {
    const inClincher = s.question.round === "CL";
    const inPlay = !inClincher || (s.clincherGroups ?? []).includes(me.groupId ?? -1);
    const canAnswer = s.phase === "QUESTION_LIVE" && me.role === "ANSWERER" && inPlay;
    const mine = r?.questionId === s.question.id ? r.mine : null;
    return (
      <main
        className="mx-auto min-h-dvh w-full max-w-md space-y-5 py-5 text-navy md:max-w-5xl md:space-y-6 md:py-8"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
          paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
          paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* no `sound` prop here: phones stay quiet, only the board plays timer sounds */}
        <QuestionScreen s={s} now={now} badge={badge} />
        {canAnswer && (
          <AnswerBox key={s.question.id} s={s} now={now} submitted={mine?.answer ?? null} onSent={reload} />
        )}
        {s.phase === "QUESTION_LIVE" && inPlay && me.role !== "ANSWERER" && (
          <p className="glass !p-4 text-center text-lg font-semibold text-navy">
            {mine ? "Your Answerer has submitted." : "Your group's Answerer types the answer. Discuss in Meet."}
          </p>
        )}
        {inClincher && !inPlay && (
          <p className="rounded-2xl border-2 border-gold bg-[#FFF3C7] p-4 text-center font-display text-xl uppercase tracking-widest text-[#6B4700]">
            Clincher in progress. Your group is watching.
          </p>
        )}
        <RevealPanel r={r} questionId={s.question.id} myGroupId={me.groupId} />
      </main>
    );
  }

  if (s.phase === "REGISTRATION" || s.phase === "GROUPING") {
    return (
      <Shell>
        <div className="glass my-auto text-center" style={{ animation: "up .5s ease backwards" }}>
          <p className="eyebrow">{s.phase === "REGISTRATION" ? "Registered" : "Registration closed"}</p>
          <h1 className="mt-2 font-display text-4xl uppercase leading-tight tracking-wide text-navy-deep md:text-5xl">
            Hi, {me.fullName}!
          </h1>
          <p className="mt-3 text-lg font-medium text-navy md:text-xl">
            {s.phase === "REGISTRATION"
              ? "You're registered. Waiting for the Quiz Master to close registration..."
              : "Registration is closed. Waiting for the Quiz Master to assign groups..."}
          </p>
          <div className="mt-6 inline-flex animate-pulse items-center gap-2 rounded-full bg-ice px-5 py-2 font-display text-lg tracking-widest text-royal">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-danger" aria-hidden />
            {s.registered} registered so far
          </div>
        </div>
      </Shell>
    );
  }

  if (s.phase === "ROUND_SCOREBOARD" || s.phase === "FINAL") {
    return (
      <Shell>
        {r?.standings ? (
          <>
            {s.phase === "FINAL" && <Podium rows={r.standings} />}
            <Scoreboard
              rows={r.standings}
              title={s.phase === "FINAL" ? "Final standings" : "Round scoreboard"}
              highlight={me.groupId}
            />
          </>
        ) : (
          <p className="my-auto animate-pulse text-center font-display text-2xl uppercase tracking-[.2em] text-mute">
            Loading scores...
          </p>
        )}
      </Shell>
    );
  }

  if (!["ROLES", "LOBBY"].includes(s.phase)) {
    return (
      <Shell>
        <div className="glass my-auto text-center">
          <h1 className="font-display text-4xl uppercase tracking-wide text-navy-deep">
            {s.phase === "FINAL" ? "The quiz is finished" : "Get ready..."}
          </h1>
          <p className="mt-3 text-lg font-medium text-mute">
            {s.phase === "ROUND_SCOREBOARD"
              ? "Round scoreboard coming up."
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
      <header
        className="glass !p-5"
        style={{ borderLeft: `10px solid ${myGroup?.color ?? "var(--blue)"}` }}
      >
        <p className="text-base font-semibold text-mute">
          {me.fullName} · {me.college}
        </p>
        <h1 className="font-display text-5xl uppercase tracking-wide text-navy-deep md:text-6xl">
          <span
            className="mr-3 inline-block h-5 w-5 rounded-full align-middle"
            style={{
              background: myGroup?.color ?? "var(--mute)",
              boxShadow: `0 0 0 4px color-mix(in srgb, ${myGroup?.color ?? "#50689A"} 30%, transparent)`,
            }}
            aria-hidden
          />
          {myGroup?.label ?? "No group yet"}
        </h1>
      </header>

      {!me.role ? (
        <section className="glass space-y-4">
          <h2 className="font-display text-3xl uppercase tracking-wide text-navy-deep">Choose your role</h2>
          <p className="text-base font-medium text-navy">
            Each group has exactly one Answerer, the only person who types the group's answer. Everyone else is a
            Viewer and answers by speaking in Google Meet.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              disabled={busy || taken}
              onClick={() => chooseRole("ANSWERER")}
              className="btn-gold !flex-col !gap-1 !py-6 !text-3xl"
            >
              Answerer
              {taken && (
                <span className="font-sans text-sm font-bold normal-case tracking-normal">
                  Taken by {answerer?.name}
                </span>
              )}
            </button>
            <button
              disabled={busy}
              onClick={() => chooseRole("VIEWER")}
              className="btn-primary !flex-col !gap-1 !py-6 !text-3xl"
            >
              Viewer
              <span className="font-sans text-sm font-semibold normal-case tracking-normal text-white/90">
                Answer by speaking in Meet
              </span>
            </button>
          </div>
          {error && (
            <p role="alert" className="rounded-2xl border-2 border-red-300 bg-red-50 p-3 font-semibold text-red-800">
              {error}
            </p>
          )}
        </section>
      ) : (
        <section className="glass space-y-3 text-center">
          <div className="animate-pulse font-display text-2xl uppercase tracking-wide text-navy-deep md:text-3xl">
            Waiting for the Quiz Master to start the quiz...
          </div>
          <p className="text-lg font-medium text-navy">
            You are the{" "}
            <span className="rounded-full bg-gold-soft px-3 py-0.5 font-display tracking-widest text-navy-deep">
              {me.role}
            </span>{" "}
            of {myGroup?.label}.
          </p>
          <p className="font-semibold text-mute">{s.groupsReady} of 6 groups ready</p>
          <button
            onClick={() => chooseRole(me.role === "ANSWERER" ? "VIEWER" : "ANSWERER")}
            disabled={busy || (me.role === "VIEWER" && taken)}
            className="min-h-11 px-4 text-base font-bold text-royal underline disabled:opacity-40"
          >
            Change role
          </button>
          {error && (
            <p role="alert" className="font-semibold text-red-700">
              {error}
            </p>
          )}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {s.groups.map((g, i) => {
          const mineGroup = g.id === me.groupId;
          return (
            <div
              key={g.id}
              className={`overflow-hidden rounded-2xl bg-white ${mineGroup ? "glow-pulse" : ""}`}
              style={{
                border: mineGroup ? `3px solid ${g.color}` : "1px solid var(--line)",
                borderTop: `8px solid ${g.color}`,
                boxShadow: mineGroup
                  ? `0 0 0 5px color-mix(in srgb, ${g.color} 30%, transparent), 0 0 36px color-mix(in srgb, ${g.color} 55%, transparent)`
                  : "0 6px 18px #1D6FE814",
                animation: "up .5s ease backwards",
                animationDelay: `${i * 70}ms`,
              }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-royal/15 px-4 py-3 font-display text-xl uppercase tracking-widest text-navy-deep">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-4 w-4 rounded-full"
                    style={{ background: g.color, boxShadow: `0 0 0 3px color-mix(in srgb, ${g.color} 30%, transparent)` }}
                  />
                  {g.label}
                </span>
                {mineGroup && (
                  <span className="rounded-full bg-navy px-2 py-0.5 text-xs tracking-widest text-white">YOU</span>
                )}
              </div>
              <ul className="divide-y divide-royal/10">
                {g.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span className="min-w-0 font-semibold text-navy">
                      <span className="block truncate">{m.name}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 font-normal text-mute">
                        <CollegeBadge college={m.college} />
                        <span className="truncate">{m.college}</span>
                      </span>
                    </span>
                    {m.role === "ANSWERER" && (
                      <span className="shrink-0 rounded-full bg-gold-soft px-2 py-0.5 text-xs font-extrabold tracking-wider text-navy-deep">
                        ANSWERER
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </Shell>
  );
}
