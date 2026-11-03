"use client";
import HostQuiz from "@/components/HostQuiz";
import HostGrouping from "@/components/HostGrouping";
import { useCallback, useEffect, useState } from "react";
import { COLLEGES } from "@/lib/constants";

type P = { id: string; full_name: string; college: string; group_id: number | null; role: string | null };
type Roster = { participants: P[]; registration_open: boolean; max_participants: number; phase: string };

const TARGET: Record<string, number> = { CEN: 14, CAS: 6, CAG: 5, CIT: 3, CTE: 2 };
const input = "rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-amber-400";

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

  if (authed === null) return <main className="p-8 text-slate-400">Loading...</main>;

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <form onSubmit={login} className="w-full max-w-sm space-y-4">
          <h1 className="text-3xl font-bold">Quiz Master Login</h1>
          <input
            type="password"
            autoFocus
            className={input + " w-full text-lg"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-400">{error}</p>}
          <button className="w-full rounded-xl bg-amber-400 py-3 text-lg font-bold text-slate-950">Enter</button>
        </form>
      </main>
    );
  }

  const list = roster?.participants ?? [];
  const counts = Object.fromEntries(COLLEGES.map((c) => [c, list.filter((p) => p.college === c).length]));
  const open = roster?.registration_open ?? true;

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quiz Master Console</h1>
          <p className="text-slate-400">
            Phase: <span className="text-amber-400 font-semibold">{roster?.phase}</span>
          </p>
        </div>
        <button
          onClick={() => call("/api/host/registration", "POST", { open: !open })}
          className={`rounded-xl px-6 py-3 text-lg font-bold text-slate-950 ${open ? "bg-red-400" : "bg-emerald-400"}`}
        >
          {open ? "Close registration" : "Reopen registration"}
        </button>
      </header>

      {error && <p className="rounded-lg bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}

      <HostGrouping
        phase={roster?.phase ?? ""}
        total={list.length}
        max={roster?.max_participants ?? 30}
        onChange={load}
      />
      <HostQuiz />

      <section className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <div className="rounded-xl bg-slate-900 border border-slate-700 p-4 text-center">
          <div className="text-3xl font-extrabold">
            {list.length}/{roster?.max_participants}
          </div>
          <div className="text-slate-400 text-sm">Registered</div>
        </div>
        {COLLEGES.map((c) => (
          <div key={c} className="rounded-xl bg-slate-900 border border-slate-700 p-4 text-center">
            <div className="text-3xl font-extrabold">
              {counts[c]}
              <span className="text-slate-500 text-lg">/{TARGET[c]}</span>
            </div>
            <div className="text-slate-400 text-sm">{c}</div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 text-sm">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Name</th>
              <th className="p-3">College</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p, i) => (
              <tr key={p.id} className="border-t border-slate-800">
                <td className="p-3 text-slate-500">{i + 1}</td>
                {editId === p.id ? (
                  <>
                    <td className="p-3">
                      <input className={input + " w-full"} value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </td>
                    <td className="p-3">
                      <select className={input} value={editCollege} onChange={(e) => setEditCollege(e.target.value)}>
                        {COLLEGES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-right space-x-3">
                      <button
                        className="text-emerald-400"
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
                      <button className="text-slate-400" onClick={() => setEditId(null)}>
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 font-medium">{p.full_name}</td>
                    <td className="p-3">{p.college}</td>
                    <td className="p-3 text-right space-x-4">
                      <button
                        className="text-amber-400"
                        onClick={() => {
                          setEditId(p.id);
                          setEditName(p.full_name);
                          setEditCollege(p.college);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-400"
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
                <td colSpan={4} className="p-6 text-center text-slate-500">
                  No one has registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}