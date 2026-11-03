import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8 text-center">
      <div>
        <p className="text-amber-400 tracking-widest text-sm font-semibold">SLSU-DOST SA STEM QUIZ BEE</p>
        <h1 className="mt-3 text-5xl md:text-6xl font-extrabold">Battle of the Scholar Minds</h1>
        <p className="mt-3 text-slate-400 text-lg">November 13, 2026</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 w-full max-w-3xl">
        <Link
          href="/host"
          className="rounded-2xl border border-slate-700 bg-slate-900 p-10 text-3xl font-bold hover:border-amber-400 hover:bg-slate-800 transition"
        >
          Quiz Master
        </Link>
        <Link
          href="/register"
          className="rounded-2xl border border-slate-700 bg-slate-900 p-10 text-3xl font-bold hover:border-emerald-400 hover:bg-slate-800 transition"
        >
          Participant
        </Link>
      </div>
    </main>
  );
}