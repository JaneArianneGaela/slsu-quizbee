import type { StandingRow } from "@/lib/useResults";

export function Scoreboard({
  rows, title, highlight,
}: {
  rows: StandingRow[];
  title: string;
  highlight?: number | null;
}) {
  const showCl = rows.some((r) => r.cl > 0);
  return (
    <section className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-5">
      <h2 className="mb-3 text-center text-3xl font-extrabold">{title}</h2>
      <table className="w-full text-left text-xl">
        <thead className="text-sm text-slate-400">
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
          {rows.map((r) => (
            <tr
              key={r.groupId}
              className={`border-t border-slate-800 ${r.groupId === highlight ? "bg-slate-800" : ""}`}
            >
              <td className="p-2 font-bold">{r.rank}</td>
              <td className="p-2">
                <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: r.color }} />
                {r.label}
              </td>
              <td className="p-2 text-right">{r.r1}</td>
              <td className="p-2 text-right">{r.r2}</td>
              <td className="p-2 text-right">{r.r3}</td>
              {showCl && <td className="p-2 text-right">{r.cl}</td>}
              <td className="p-2 text-right font-extrabold text-amber-400">{r.main}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function Podium({ rows }: { rows: StandingRow[] }) {
  let top = rows.filter((r) => r.rank <= 3);
  if (top.length === 3 && top[0].rank === 1 && top[1].rank === 2 && top[2].rank === 3) {
    top = [top[1], top[0], top[2]]; // classic 2nd, 1st, 3rd layout
  }
  const medal = (n: number) => (n === 1 ? "🥇" : n === 2 ? "🥈" : "🥉");
  const height = (n: number) => (n === 1 ? "h-64" : n === 2 ? "h-52" : "h-44");
  return (
    <div className="flex w-full items-end justify-center gap-4">
      {top.map((r) => (
        <div
          key={r.groupId}
          className={`flex w-48 flex-col items-center justify-end rounded-t-2xl p-4 text-slate-950 ${height(r.rank)}`}
          style={{ background: r.color }}
        >
          <div className="text-5xl">{medal(r.rank)}</div>
          <div className="text-2xl font-extrabold">{r.label}</div>
          <div className="text-xl font-bold">{r.main} pts{r.cl > 0 ? ` (+${r.cl})` : ""}</div>
        </div>
      ))}
    </div>
  );
}