"use client";
import { useCallback, useEffect, useState } from "react";
import Wheel from "@/components/Wheel";

type Member = { id: string; name: string; college: string; role: "VIEWER" | "ANSWERER" | null };
type Group = { id: number; label: string; color: string; members: Member[] };
type State = { groups: Group[]; groupsReady: number };
type Seq = { name: string; college: string; group_id: number };

export default function HostGrouping({
  phase,
  total,
  max,
  onChange,
}: {
  phase: string;
  total: number;
  max: number;
  onChange: () => void;
}) {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [seq, setSeq] = useState<Seq[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [spinKey, setSpinKey] = useState(0);
  const [fast, setFast] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      if (r.ok) setState(await r.json());
    } catch {
      /* connection blip: keep the last state, the next poll retries */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [load]);

  // advance the wheel reveal one participant at a time
  useEffect(() => {
    if (!seq) return;
    const t = setTimeout(
      () => {
        if (idx + 1 >= seq.length) setSeq(null);
        else {
          setIdx(idx + 1);
          setSpinKey((k) => k + 1);
        }
      },
      fast ? 800 : 4800
    );
    return () => clearTimeout(t);
  }, [seq, idx, fast]);

  async function post(url: string, body?: unknown) {
    setError("");
    setBusy(true);
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error ?? "Action failed.");
        return null;
      }
      return d;
    } catch {
      setError("Network error.");
      return null;
    } finally {
      setBusy(false);
      onChange();
      load();
    }
  }

  async function spin() {
    if (total !== max && !confirm(`Only ${total} of ${max} are registered. Spin anyway?`)) return;
    if (phase === "ROLES" && !confirm("Re-spin clears all groups and roles. Continue?")) return;
    const d = await post("/api/host/spin");
    if (d?.sequence?.length) {
      setFast(false);
      setIdx(0);
      setSpinKey((k) => k + 1);
      setSeq(d.sequence);
    }
  }

  const groups = state?.groups ?? [];
  const ready = state?.groupsReady ?? 0;
  const dur = fast ? 500 : 3000;
  const cur = seq?.[idx];

  return (
    <section className="space-y-4">
      {seq && cur && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-950/95 p-6">
          <p className="text-slate-400">
            {idx + 1} / {seq.length}
          </p>
          <div key={idx} className="text-center">
            <div className="text-4xl font-extrabold">{cur.name}</div>
            <div className="text-xl text-slate-400">{cur.college}</div>
          </div>
          <Wheel target={cur.group_id} spinKey={spinKey} durationMs={dur} size={320} />
          <div
            key={`g${idx}`}
            className="text-5xl font-extrabold text-amber-400"
            style={{ opacity: 0, animation: "fadeIn .4s ease forwards", animationDelay: `${dur}ms` }}
          >
            GROUP {cur.group_id}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setFast((f) => !f)}
              className="rounded-lg border border-slate-600 px-5 py-2"
            >
              {fast ? "Normal speed" : "Fast mode"}
            </button>
            <button onClick={() => setSeq(null)} className="rounded-lg bg-amber-400 px-5 py-2 font-bold text-slate-950">
              Skip
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {phase === "REGISTRATION" && (
          <p className="text-slate-400">Close registration to enable the spin.</p>
        )}
        {(phase === "GROUPING" || phase === "ROLES") && (
          <button
            disabled={busy}
            onClick={spin}
            className="rounded-xl bg-amber-400 px-6 py-3 text-lg font-bold text-slate-950 disabled:opacity-50"
          >
            {phase === "GROUPING" ? "SPIN THE WHEEL" : "Re-spin"}
          </button>
        )}
        {phase === "ROLES" && (
          <button
            disabled={busy}
            onClick={() => post("/api/host/phase", { phase: "LOBBY" })}
            className="rounded-xl bg-emerald-400 px-6 py-3 text-lg font-bold text-slate-950 disabled:opacity-50"
          >
            Open lobby
          </button>
        )}
      </div>

      {error && <p className="rounded-lg border border-red-800 bg-red-950 p-3 text-red-300">{error}</p>}

      {groups.length > 0 && (
        <>
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="mb-2 font-bold">Readiness checklist</h2>
            <p className={total === max ? "text-emerald-400" : "text-amber-400"}>
              {total === max ? "✓" : "✗"} All {max} registered ({total}/{max})
            </p>
            <p className={ready === 6 ? "text-emerald-400" : "text-amber-400"}>
              {ready === 6 ? "✓" : "✗"} All 6 Answerers chosen ({ready}/6)
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {groups.map((g) => (
              <div key={g.id} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                <div className="px-4 py-2 font-bold text-slate-950" style={{ background: g.color }}>
                  {g.label} · {g.members.length} members
                </div>
                <ul className="divide-y divide-slate-800">
                  {g.members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                      <span>
                        {m.name} <span className="text-slate-500">({m.college})</span>
                        {m.role === "ANSWERER" && (
                          <span className="ml-2 rounded bg-amber-400 px-1.5 py-0.5 text-xs font-bold text-slate-950">
                            ANSWERER
                          </span>
                        )}
                      </span>
                      {m.role !== "ANSWERER" && ["ROLES", "LOBBY"].includes(phase) && (
                        <button
                          className="text-amber-400"
                          onClick={() => post("/api/host/role", { participantId: m.id, role: "ANSWERER" })}
                        >
                          Make Answerer
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}