"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { COLLEGES } from "@/lib/constants";
import { BrandHeader } from "@/components/BrandHeader";
import { sfx } from "@/lib/sound";

const input =
  "w-full rounded-2xl border-2 border-line bg-white px-4 py-3.5 text-lg text-navy outline-none transition placeholder:text-mute focus:border-aqua focus:shadow-[0_0_0_5px_#29C4FF22]";

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
      if (mode === "register") {
        setIssuedPin(data.pin);
        sfx.win();
      } else window.location.href = "/play";
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (issuedPin) {
    return (
      <>
        <BrandHeader live={false} />
        <main className="grid flex-1 place-items-center p-4">
          <div className="glass scan w-full max-w-xl text-center">
            <p className="eyebrow">Registration complete</p>
            <h1 className="display text-[clamp(2rem,6vw,3rem)]">
              You&apos;re <em className="hl">registered!</em>
            </h1>
            <p className="text-lg text-mute">
              Your PIN (shown only once). Write it down or take a photo.
            </p>

            <div
              role="group"
              aria-label={`Your PIN is ${issuedPin.split("").join(" ")}`}
              className="my-7 flex justify-center gap-3 sm:gap-4"
            >
              {issuedPin.split("").map((d, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="grid h-24 w-[4.25rem] place-items-center rounded-2xl bg-navy font-display text-[4.5rem] leading-none text-aqua shadow-[inset_0_0_30px_#29C4FF22,0_8px_24px_#0A2A6B44] sm:h-32 sm:w-24 sm:text-[6rem]"
                  style={{
                    animation: `up .6s ${i * 0.3}s both, glowp 2.4s ${1.4 + i * 0.25}s infinite`,
                  }}
                >
                  {d}
                </span>
              ))}
            </div>

            <p className="mx-auto mb-6 max-w-md text-mute">
              If you refresh or lose connection, rejoin with your name + this PIN.
            </p>
            <Link href="/play" className="btn-primary w-full sm:w-auto">
              I saved my PIN — Continue
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <BrandHeader live={false} />
      <main className="grid flex-1 place-items-center p-4">
        <form onSubmit={submit} className="glass w-full max-w-md space-y-5">
          <div>
            <p className="eyebrow">SLSU-DOST SA · Scholar Registry</p>
            <h1 className="display text-[clamp(2.2rem,7vw,3.2rem)]">
              {mode === "register" ? (
                <>
                  <em className="hl">Register</em>
                </>
              ) : (
                <>
                  <em className="hl">Rejoin</em>
                </>
              )}
            </h1>
          </div>

          <input
            className={input}
            placeholder="Full name"
            aria-label="Full name"
            value={fullName}
            maxLength={80}
            onChange={(e) => setFullName(e.target.value)}
          />

          {mode === "register" ? (
            <>
              <div
                role="group"
                aria-label="Choose your college"
                className="grid grid-cols-5 gap-2"
              >
                {COLLEGES.map((c) => {
                  const on = college === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        sfx.select();
                        setCollege(c);
                      }}
                      className={`flex flex-col items-center gap-1 rounded-2xl border-2 bg-white px-1 py-2 transition hover:-translate-y-0.5 ${
                        on
                          ? "border-royal bg-[#F2F8FF] shadow-[0_0_0_5px_#1D6FE822,0_10px_30px_#1D6FE833]"
                          : "border-line"
                      }`}
                    >
                      <Image
                        src={`/${c}.png`}
                        alt=""
                        width={44}
                        height={44}
                        className="h-11 w-11 object-contain drop-shadow-[0_4px_8px_#0A2A6B33]"
                      />
                      <span
                        className="font-display text-sm tracking-[.12em]"
                        style={{ color: `var(--${c.toLowerCase()})` }}
                      >
                        {c}
                      </span>
                    </button>
                  );
                })}
              </div>
              <select
                className={input}
                aria-label="College"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
              >
                <option value="">Select your college</option>
                {COLLEGES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <input
              className={`${input} text-center font-display text-3xl tracking-[.4em]`}
              placeholder="4-digit PIN"
              aria-label="4-digit PIN"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
          )}

          {error && (
            <p
              role="alert"
              className="rounded-2xl border border-danger bg-[#FDECEC] p-3 font-semibold text-[#9B1C20]"
            >
              {error}
            </p>
          )}

          <button disabled={busy} className="btn-primary w-full">
            {busy ? "Please wait..." : mode === "register" ? "Register" : "Rejoin"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "register" ? "rejoin" : "register");
              setError("");
            }}
            className="w-full py-2 font-semibold text-royal underline underline-offset-4 hover:text-navy"
          >
            {mode === "register" ? "Already registered? Rejoin with PIN" : "New here? Register"}
          </button>
        </form>
      </main>
    </>
  );
}