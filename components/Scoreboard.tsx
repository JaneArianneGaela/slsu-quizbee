"use client";
import { useEffect } from "react";
import type { StandingRow } from "@/lib/useResults";
import { sfx } from "@/lib/sound";

const css = `
@keyframes sb-row { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: none; } }
@keyframes sb-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes sb-fall { 0% { transform: translateY(-20px) rotate(0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(24rem) rotate(540deg); opacity: .9; } }
@keyframes sb-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.sb-row { animation: sb-row .5s cubic-bezier(.2,.8,.2,1) backwards; }
.sb-bar { transform-origin: left; animation: sb-grow 1s cubic-bezier(.2,.8,.2,1) backwards; }
.sb-conf { position: absolute; top: -20px; animation: sb-fall linear infinite; }
.sb-block {
  position: relative; transform-origin: bottom; animation: sb-rise .9s cubic-bezier(.2,.8,.2,1) backwards;
  background: linear-gradient(180deg, var(--hi), var(--mid) 45%, var(--lo));
  box-shadow: inset 0 3px 0 #ffffffaa, inset 0 -14px 24px #0000003a, inset 10px 0 18px #ffffff33, inset -10px 0 18px #0000002a, 0 26px 30px -8px #0A2A6B66;
}
.sb-block::before {
  content: ""; position: absolute; left: 0; right: 0; top: -16px; height: 16px;
  background: linear-gradient(90deg, var(--hi), #fff 50%, var(--hi));
  clip-path: polygon(7% 0, 93% 0, 100% 100%, 0 100%); opacity: .95;
}
`;

const medal = (n: number) => (n === 1 ? "🥇" : n === 2 ? "🥈" : n === 3 ? "🥉" : "");

export function Scoreboard({
  rows, title, highlight,
}: {
  rows: StandingRow[];
  title: string;
  highlight?: number | null;
}) {
  useEffect(() => {
    sfx.whoosh();
  }, []);

  const showCl = rows.some((r) => r.cl > 0);
  const maxMain = Math.max(1, ...rows.map((r) => r.main));
  const isTie = (rank: number) => rows.filter((r) => r.rank === rank).length > 1;
  return (
    <section className="glass w-full text-navy">
      <style>{css}</style>
      <h2 className="mb-4 text-center font-display text-4xl uppercase tracking-[.1em] text-navy-deep md:text-5xl">{title}</h2>
      <table className="w-full text-left text-xl md:text-2xl">
        <thead className="text-sm font-bold uppercase tracking-widest text-mute">
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">Group</th>
            <th className="p-2 text-right">R1</th>
            <th className="p-2 text-right">R2</th>
            <th className="p-2 text-right">R3</th>
            {showCl && <th className="p-2 text-right">CL</th>}
            <th className="p-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const me = r.groupId === highlight;
            return (
              <tr
                key={r.groupId}
                className={`sb-row border-t border-royal/15 ${me ? "bg-[#FFF3C7] outline outline-4 -outline-offset-4 outline-gold" : ""}`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <td className="p-2 font-display text-3xl text-navy-deep">
                  <span aria-hidden>{medal(r.rank)}</span>
                  <span className={r.rank <= 3 ? "sr-only" : ""}>{r.rank}</span>
                  {isTie(r.rank) && <span className="ml-1 text-xs tracking-widest text-mute">T</span>}
                </td>
                <td className="min-w-[10rem] p-2">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="inline-block h-4 w-4 rounded-full" style={{ background: r.color, boxShadow: `0 0 0 3px color-mix(in srgb, ${r.color} 30%, transparent)` }} />
                    {r.label}
                    {me && <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-bold tracking-widest text-white">YOU</span>}
                  </div>
                  <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-ice" aria-hidden>
                    <div
                      className="sb-bar h-full rounded-full"
                      style={{ width: `${(r.main / maxMain) * 100}%`, background: r.color, animationDelay: `${300 + i * 90}ms` }}
                    />
                  </div>
                </td>
                <td className="p-2 text-right tabular-nums">{r.r1}</td>
                <td className="p-2 text-right tabular-nums">{r.r2}</td>
                <td className="p-2 text-right tabular-nums">{r.r3}</td>
                {showCl && <td className="p-2 text-right tabular-nums">{r.cl}</td>}
                <td className="p-2 text-right font-display text-3xl tabular-nums text-navy md:text-4xl">{r.main}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

const METAL: Record<number, { hi: string; mid: string; lo: string }> = {
  1: { hi: "#FFE9A0", mid: "#FFC93C", lo: "#B07C00" },
  2: { hi: "#F7F9FC", mid: "#C3CCDA", lo: "#7F8CA1" },
  3: { hi: "#F5C497", mid: "#D08A4A", lo: "#8A4B1C" },
};
const CONF = ["#FFC93C", "#29C4FF", "#1D6FE8", "#E5484D", "#16A36A", "#8B5CF6", "#EC4899"];

export function Podium({ rows }: { rows: StandingRow[] }) {
  useEffect(() => {
    sfx.fanfare();
  }, []);

  let top = rows.filter((r) => r.rank <= 3);
  if (top.length === 3 && top[0].rank === 1 && top[1].rank === 2 && top[2].rank === 3) {
    top = [top[1], top[0], top[2]]; // classic 2nd, 1st, 3rd layout
  }
  const height = (n: number) => (n === 1 ? "h-64" : n === 2 ? "h-52" : "h-44");
  return (
    <div className="relative flex min-h-[24rem] w-full items-end justify-center gap-4 overflow-hidden px-2 pt-10">
      <style>{css}</style>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="sb-conf"
            style={{
              left: `${(i * 37) % 100}%`,
              width: 8 + (i % 3) * 4,
              height: 12 + (i % 4) * 4,
              background: CONF[i % CONF.length],
              borderRadius: i % 2 ? 2 : 999,
              animationDuration: `${3 + (i % 5) * 0.7}s`,
              animationDelay: `${(i % 9) * 0.35}s`,
            }}
          />
        ))}
      </div>
      {top.map((r, i) => {
        const m = METAL[r.rank] ?? METAL[3];
        return (
          <div
            key={r.groupId}
            className={`sb-block flex w-48 flex-col items-center justify-end gap-1 p-4 text-navy-deep md:w-56 ${height(r.rank)}`}
            style={{ ["--hi" as string]: m.hi, ["--mid" as string]: m.mid, ["--lo" as string]: m.lo, animationDelay: `${i * 150}ms` } as React.CSSProperties}
          >
            <div className="text-5xl" aria-hidden>{medal(r.rank)}</div>
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xl font-extrabold">
              <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: r.color }} />
              {r.label}
            </div>
            <div className="font-display text-2xl tracking-wide">
              {r.main} pts{r.cl > 0 ? ` (+${r.cl})` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}