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
  const curGroup = cur ? groups.find((g) => g.id === cur.group_id) : undefined;

  return (
    <section className="space-y-5 text-navy">
      {seq && cur && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 text-white"
          style={{ background: "radial-gradient(ellipse at 50% 25%, #123C93f5, #061A4A 75%)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Group assignment wheel"
        >
          <div className="w-full max-w-md">
            <p className="mb-2 text-center font-display text-xl tracking-[.2em] text-sky-300">
              {idx + 1} / {seq.length}
            </p>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20" aria-hidden>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${((idx + 1) / seq.length) * 100}%`,
                  background: "linear-gradient(90deg, #29C4FF, #FFC93C)",
                  transition: "width .4s ease",
                }}
              />
            </div>
          </div>
          <div key={idx} className="text-center" style={{ animation: "fadeIn .4s ease both" }}>
            <div className="font-display text-5xl uppercase tracking-wide md:text-6xl">{cur.name}</div>
            <div className="mt-1 text-2xl font-semibold text-sky-200">{cur.college}</div>
          </div>
          <Wheel target={cur.group_id} spinKey={spinKey} durationMs={dur} size={320} />
          <div
            key={`g${idx}`}
            className="text-center font-display text-6xl uppercase tracking-[.1em] text-gold-soft md:text-7xl"
            style={{ opacity: 0, animation: "fadeIn .4s ease forwards", animationDelay: `${dur}ms` }}
          >
            GROUP {cur.group_id}
            <span
              aria-hidden
              className="mx-auto mt-2 block h-2 w-40 rounded-full"
              style={{ background: curGroup?.color ?? "#FFC93C", boxShadow: `0 0 18px ${curGroup?.color ?? "#FFC93C"}` }}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setFast((f) => !f)} className="btn-ghost">
              {fast ? "Normal speed" : "Fast mode"}
            </button>
            <button onClick={() => setSeq(null)} className="btn-gold">
              Skip
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {phase === "REGISTRATION" && (
          <p className="eyebrow !text-mute">Close registration to enable the spin.</p>
        )}
        {(phase === "GROUPING" || phase === "ROLES") && (
          <button disabled={busy} onClick={spin} className="btn-gold">
            {phase === "GROUPING" ? "SPIN THE WHEEL" : "Re-spin"}
          </button>
        )}
        {phase === "ROLES" && (
          <button
            disabled={busy}
            onClick={() => post("/api/host/phase", { phase: "LOBBY" })}
            className="btn-primary"
          >
            Open lobby
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 p-3 font-semibold text-red-800">
          {error}
        </p>
      )}

      {groups.length > 0 && (
        <>
          <div className="glass !p-5">
            <h2 className="eyebrow mb-3">Readiness checklist</h2>
            <p className={`text-lg font-bold ${total === max ? "text-[#0B7A4D]" : "text-[#8A5A00]"}`}>
              {total === max ? "✓" : "✗"} All {max} registered ({total}/{max})
            </p>
            <p className={`text-lg font-bold ${ready === 6 ? "text-[#0B7A4D]" : "text-[#8A5A00]"}`}>
              {ready === 6 ? "✓" : "✗"} All 6 Answerers chosen ({ready}/6)
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {groups.map((g, i) => (
              <div
                key={g.id}
                className="overflow-hidden rounded-2xl bg-white"
                style={{
                  borderTop: `8px solid ${g.color}`,
                  boxShadow: `0 0 0 1px var(--line), 0 10px 28px color-mix(in srgb, ${g.color} 28%, transparent)`,
                  animation: "up .5s ease backwards",
                  animationDelay: `${i * 70}ms`,
                }}
              >
                <div className="flex items-center gap-2 border-b border-royal/15 px-4 py-3 font-display text-xl uppercase tracking-widest text-navy-deep">
                  <span
                    className="inline-block h-4 w-4 rounded-full"
                    style={{ background: g.color, boxShadow: `0 0 0 3px color-mix(in srgb, ${g.color} 30%, transparent)` }}
                  />
                  {g.label} · {g.members.length} members
                </div>
                <ul className="divide-y divide-royal/10">
                  {g.members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                      <span className="font-semibold text-navy">
                        {m.name} <span className="font-normal text-mute">({m.college})</span>
                        {m.role === "ANSWERER" && (
                          <span className="ml-2 rounded-full bg-gold-soft px-2 py-0.5 text-xs font-extrabold tracking-wider text-navy-deep">
                            ANSWERER
                          </span>
                        )}
                      </span>
                      {m.role !== "ANSWERER" && ["ROLES", "LOBBY"].includes(phase) && (
                        <button
                          className="shrink-0 rounded-full border-2 border-royal px-3 py-1 text-sm font-bold text-royal transition hover:bg-ice"
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