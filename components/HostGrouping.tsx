"use client";
import { useCallback, useEffect, useState } from "react";
import { GROUP_ROSTER } from "@/lib/constants";

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
      /* Keep the last roster while the next poll retries. */
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => void load(), 0);
    const poll = setInterval(() => void load(), 2000);
    return () => {
      clearTimeout(initial);
      clearInterval(poll);
    };
  }, [load]);

  async function setRole(participantId: string, role: "VIEWER" | "ANSWERER") {
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/host/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, role }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error ?? "Could not update the role.");
        return;
      }
      await load();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
      onChange();
    }
  }

  async function openLobby() {
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/host/phase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "LOBBY" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error ?? "Could not open the lobby.");
        return;
      }
      await load();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
      onChange();
    }
  }

  const groups = state?.groups ?? [];
  const ready = state?.groupsReady ?? 0;
  const groupCount = GROUP_ROSTER.length;
  const groupsWithMembers = groups.filter((group) => group.members.length > 0).length;

  return (
    <section className="space-y-5 text-navy">
      <div className="glass !p-5">
        <h2 className="eyebrow mb-3">Group readiness</h2>
        <p className="text-lg font-bold text-navy">
          Participants select their pre-announced group when they sign in.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <p className={`text-lg font-bold ${groupsWithMembers === groupCount ? "text-[#0B7A4D]" : "text-[#8A5A00]"}`}>
            {groupsWithMembers === groupCount ? "✓" : "○"} Groups represented ({groupsWithMembers}/{groupCount})
          </p>
          <p className={`text-lg font-bold ${ready === groupCount ? "text-[#0B7A4D]" : "text-[#8A5A00]"}`}>
            {ready === groupCount ? "✓" : "○"} Representatives chosen ({ready}/{groupCount})
          </p>
          <p className="text-sm font-semibold text-mute">Registered: {total}/{max}</p>
          {phase === "REGISTRATION" && (
            <p className="text-sm font-semibold text-mute">Close registration to open the lobby.</p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 p-3 font-semibold text-red-800">
          {error}
        </p>
      )}

      {phase === "ROLES" && (
        <button disabled={busy} onClick={openLobby} className="btn-primary">
          Open lobby
        </button>
      )}

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
              <span className="inline-block h-4 w-4 rounded-full" style={{ background: g.color }} />
              {g.label} · {g.members.length} members
            </div>
            {g.members.length ? (
              <ul className="divide-y divide-royal/10">
                {g.members.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                    <span className="font-semibold text-navy">
                      {m.name} <span className="font-normal text-mute">({m.college})</span>
                      {m.role && (
                        <span className="ml-2 rounded-full bg-gold-soft px-2 py-0.5 text-xs font-extrabold tracking-wider text-navy-deep">
                          {m.role === "ANSWERER" ? "REPRESENTATIVE" : "MEMBER"}
                        </span>
                      )}
                    </span>
                    {["ROLES", "LOBBY"].includes(phase) && m.role !== "ANSWERER" && (
                      <button
                        disabled={busy}
                        className="shrink-0 rounded-full border-2 border-royal px-3 py-1 text-sm font-bold text-royal transition hover:bg-ice disabled:opacity-50"
                        onClick={() => setRole(m.id, "ANSWERER")}
                      >
                        Make Representative
                      </button>
                    )}
                    {["ROLES", "LOBBY"].includes(phase) && m.role !== "VIEWER" && (
                      <button
                        disabled={busy}
                        className="shrink-0 rounded-full border-2 border-royal px-3 py-1 text-sm font-bold text-royal transition hover:bg-ice disabled:opacity-50"
                        onClick={() => setRole(m.id, "VIEWER")}
                      >
                        Make Member
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-5 text-sm font-medium text-mute">No participants selected this group yet.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
