"use client";
import { useState } from "react";
import Link from "next/link";
import { COLLEGES } from "@/lib/constants";

const input =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-lg outline-none focus:border-emerald-400";

export default function RegisterPage() {
  const [mode, setMode] = useState<"register" | "rejoin">("register");
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [issuedPin, setIssuedPin] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(mode === "register" ? "/api/register" : "/api/rejoin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "register" ? { fullName, college } : { fullName, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      if (mode === "register") setIssuedPin(data.pin);
      else window.location.href = "/play";
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (issuedPin) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
        <h1 className="text-3xl font-bold">You&apos;re registered!</h1>
        <p className="text-slate-400">Your PIN (shown only once). Write it down or take a photo.</p>
        <div className="text-8xl font-extrabold tracking-[0.3em] text-amber-400">{issuedPin}</div>
        <p className="text-slate-400 max-w-md">
          If you refresh or lose connection, rejoin with your name + this PIN.
        </p>
        <Link href="/play" className="rounded-xl bg-emerald-500 px-8 py-4 text-xl font-bold text-slate-950">
          I saved my PIN — Continue
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md space-y-5">
        <h1 className="text-3xl font-bold">{mode === "register" ? "Register" : "Rejoin"}</h1>
        <input
          className={input}
          placeholder="Full name"
          value={fullName}
          maxLength={80}
          onChange={(e) => setFullName(e.target.value)}
        />
        {mode === "register" ? (
          <select className={input} value={college} onChange={(e) => setCollege(e.target.value)}>
            <option value="">Select your college</option>
            {COLLEGES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : (
          <input
            className={input}
            placeholder="4-digit PIN"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
        )}
        {error && <p className="rounded-lg bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-emerald-500 py-4 text-xl font-bold text-slate-950 disabled:opacity-50"
        >
          {busy ? "Please wait..." : mode === "register" ? "Register" : "Rejoin"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "register" ? "rejoin" : "register");
            setError("");
          }}
          className="w-full text-slate-400 underline"
        >
          {mode === "register" ? "Already registered? Rejoin with PIN" : "New here? Register"}
        </button>
      </form>
    </main>
  );
}