"use client";
import { useCallback, useEffect, useState } from "react";

type Member = { id: string; name: string; college: string; role: "VIEWER" | "ANSWERER" | null };
type Group = { id: number; label: string; color: string; members: Member[] };
type State = { groups: Group[]; groupsReady: number };

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

  async function assignGroups() {
    if (total !== max && !confirm(`Only ${total} of ${max} are registered. Assign groups anyway?`)) return;
    if (phase === "ROLES" && !confirm("Reassigning groups clears all groups and roles. Continue?")) return;
    await post("/api/host/spin");
  }

  const groups = state?.groups ?? [];
  const ready = state?.groupsReady ?? 0;

  return (
    <section className="space-y-5 text-navy">
      <div className="flex flex-wrap items-center gap-3">
        {phase === "REGISTRATION" && (
          <p className="eyebrow !text-mute">Close registration to enable group assignment.</p>
        )}
        {(phase === "GROUPING" || phase === "ROLES") && (
          <button disabled={busy} onClick={assignGroups} className="btn-gold">
            {phase === "GROUPING" ? "ASSIGN GROUPS" : "Reassign groups"}
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
