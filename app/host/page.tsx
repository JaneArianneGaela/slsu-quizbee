"use client";
import HostQuiz from "@/components/HostQuiz";
import HostGrouping from "@/components/HostGrouping";
import { useCallback, useEffect, useState } from "react";
import { COLLEGES } from "@/lib/constants";

type P = { id: string; full_name: string; college: string; group_id: number | null; role: string | null };
type Roster = { participants: P[]; registration_open: boolean; max_participants: number; phase: string };

const TARGET: Record<string, number> = { CEN: 16, CAS: 7, CAG: 3, CIT: 0, CTE: 2 };
const input =
  "min-h-11 rounded-xl border-2 border-royal/30 bg-white px-3 py-2 text-navy outline-none focus:border-royal focus:ring-4 focus:ring-sky-300/40";

function Ring({ college, count, target }: { college: string; count: number; target: number }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const pct = target > 0 ? Math.min(count / target, 1) : 0;
  const state = count === target ? "ok" : count < target ? "low" : "over";
  const stroke = state === "ok" ? "#16A36A" : state === "low" ? "#E0A100" : "#E5484D";
  const text = state === "ok" ? "text-[#0B7A4D]" : state === "low" ? "text-[#8A5A00]" : "text-[#B4232A]";
  const word = state === "ok" ? "complete" : state === "low" ? "below target" : "over target";
  return (
    <div className="glass !p-3 text-center" style={{ animation: "up .5s ease backwards" }}>
      <div className="relative mx-auto h-28 w-28" role="img" aria-label={`${college}: ${count} of ${target}, ${word}`}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={R} fill="none" stroke="#EAF3FF" strokeWidth="10" />
          <circle
            cx="50" cy="50" r={R} fill="none" stroke={stroke} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${C * pct} ${C}`}
            style={{ transition: "stroke-dasharray .6s ease, stroke .3s" }}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-display text-3xl tabular-nums ${text}`}>
          {count}
          <span className="text-lg opacity-80">/{target}</span>
        </div>
      </div>
      <div className="mt-1 font-display text-lg uppercase tracking-[.18em] text-navy-deep">{college}</div>
    </div>
  );
}

export default function HostPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCollege, setEditCollege] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/host/roster", { cache: "no-store" });
      if (r.status === 401) return setAuthed(false);
      if (!r.ok) return setError("Could not load the roster.");
      setRoster(await r.json());
      setAuthed(true);
    } catch {
      setError("Connection problem. Retrying...");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const r = await fetch("/api/qm/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const d = await r.json();
    if (!r.ok) return setError(d.error ?? "Login failed.");
    setPassword("");
    load();
  }

  async function call(url: string, method: string, body?: unknown) {
    setError("");
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setError(d.error ?? "Action failed.");
    load();
  }

  if (authed === null)
    return (
      <main className="grid min-h-dvh place-items-center p-8 font-display text-2xl uppercase tracking-[.2em] text-mute">
        Loading...
      </main>
    );

  if (!authed) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6 text-navy">
        <form onSubmit={login} className="glass w-full max-w-sm space-y-4" style={{ animation: "up .5s ease backwards" }}>
          <p className="eyebrow">Restricted</p>
          <h1 className="font-display text-4xl uppercase tracking-wide text-navy-deep">Admin Host Login</h1>
          <input
            type="password"
            autoFocus
            className={input + " w-full text-lg"}
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 p-3 font-semibold text-red-800">
              {error}
            </p>
          )}
          <button className="btn-primary w-full">Enter</button>
        </form>
      </main>
    );
  }

  const list = roster?.participants ?? [];
  const counts = Object.fromEntries(COLLEGES.map((c) => [c, list.filter((p) => p.college === c).length]));
  const open = roster?.registration_open ?? true;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6 text-navy">
      <header className="glass flex flex-wrap items-center justify-between gap-4 !p-5">
        <div>
          <p className="eyebrow">Control room</p>
          <h1 className="font-display text-4xl uppercase tracking-wide text-navy-deep md:text-5xl">
            Admin Host Dashboard
          </h1>
          <p className="mt-1 font-semibold text-mute">
            Phase:{" "}
            <span className="rounded-full bg-navy px-3 py-0.5 font-display tracking-widest text-white">
              {roster?.phase}
            </span>
          </p>
        </div>
        <button
          onClick={() => call("/api/host/registration", "POST", { open: !open })}
          className={open ? "btn-primary !bg-none !bg-[#B4232A] !shadow-none" : "btn-gold"}
        >
          {open ? "Close registration" : "Reopen registration"}
        </button>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 p-3 font-semibold text-red-800">
          {error}
        </p>
      )}

      <HostGrouping
        phase={roster?.phase ?? ""}
        total={list.length}
        max={roster?.max_participants ?? 28}
        onChange={load}
      />
      <HostQuiz />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <div className="stat flex flex-col justify-center">
          <b>
            {list.length}/{roster?.max_participants}
          </b>
          <span>REGISTERED</span>
        </div>
        {COLLEGES.map((c) => (
          <Ring key={c} college={c} count={counts[c]} target={TARGET[c]} />
        ))}
      </section>

      <section className="glass !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-ice text-sm font-bold uppercase tracking-widest text-mute">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Name</th>
                <th className="p-3">College</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p, i) => (
                <tr key={p.id} className="border-t border-royal/15 odd:bg-white/60">
                  <td className="p-3 font-semibold text-mute">{i + 1}</td>
                  {editId === p.id ? (
                    <>
                      <td className="p-3">
                        <input
                          className={input + " w-full"}
                          aria-label="Full name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </td>
                      <td className="p-3">
                        <select
                          className={input}
                          aria-label="College"
                          value={editCollege}
                          onChange={(e) => setEditCollege(e.target.value)}
                        >
                          {COLLEGES.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="space-x-2 p-3 text-right">
                        <button
                          className="min-h-11 rounded-full bg-[#0B7A4D] px-4 font-bold text-white"
                          onClick={async () => {
                            await call(`/api/host/participants/${p.id}`, "PATCH", {
                              fullName: editName,
                              college: editCollege,
                            });
                            setEditId(null);
                          }}
                        >
                          Save
                        </button>
                        <button
                          className="min-h-11 rounded-full border-2 border-mute px-4 font-bold text-mute"
                          onClick={() => setEditId(null)}
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 font-bold text-navy-deep">{p.full_name}</td>
                      <td className="p-3 font-semibold">{p.college}</td>
                      <td className="space-x-2 p-3 text-right">
                        <button
                          className="min-h-11 rounded-full border-2 border-royal px-4 font-bold text-royal transition hover:bg-ice"
                          onClick={() => {
                            setEditId(p.id);
                            setEditName(p.full_name);
                            setEditCollege(p.college);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="min-h-11 rounded-full border-2 border-[#B4232A] px-4 font-bold text-[#B4232A] transition hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`Remove ${p.full_name}?`)) call(`/api/host/participants/${p.id}`, "DELETE");
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {!list.length && (
                <tr>
                  <td colSpan={4} className="dotgrid p-10 text-center">
                    <div className="text-5xl" aria-hidden>👥</div>
                    <div className="mt-2 font-display text-2xl uppercase tracking-widest text-navy-deep">
                      No one has registered yet.
                    </div>
                    <p className="mt-1 font-medium text-mute">Participants will appear here as they sign up.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}