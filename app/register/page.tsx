"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { COLLEGES, GROUP_ROSTER } from "@/lib/constants";
import { BrandHeader } from "@/components/BrandHeader";
import { sfx } from "@/lib/sound";

const input =
  "w-full rounded-2xl border-2 border-line bg-white px-4 py-3.5 text-lg text-navy outline-none transition placeholder:text-mute focus:border-aqua focus:shadow-[0_0_0_5px_#29C4FF22]";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get("role") === "ANSWERER" ? "ANSWERER" : "VIEWER";
  const [mode, setMode] = useState<"register" | "rejoin">("rejoin");
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [groupId, setGroupId] = useState("");
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
        body: JSON.stringify(
          mode === "register"
            ? { fullName, college, groupId: Number(groupId), role }
            : { fullName, college, groupId: Number(groupId), pin, role }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      if (mode === "register") {
        setIssuedPin(data.pin);
        sfx.win();
      } else router.push("/play");
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
              If you refresh or lose connection, sign in with your name, department, group, and this PIN.
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
            <p className="eyebrow">SLSU-DOST SA · {role === "ANSWERER" ? "Representative" : "Member"}</p>
            <h1 className="display text-[clamp(2.2rem,7vw,3.2rem)]">
              {mode === "register" ? (
                <><em className="hl">Register</em></>
              ) : (
                <><em className="hl">Sign in</em></>
              )}
            </h1>
          </div>

          <input
            className={input}
            placeholder="Full name"
            aria-label="Full name"
            required
            value={fullName}
            maxLength={80}
            onChange={(e) => setFullName(e.target.value)}
          />

          <select
            className={input}
            aria-label="Department"
            required
            value={college}
            onChange={(e) => setCollege(e.target.value)}
          >
            <option value="">Select your department</option>
            {COLLEGES.filter((c) =>
              GROUP_ROSTER.some((group) => group.members.some(([, department]) => department === c))
            ).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className={input}
            aria-label="Pre-announced group"
            required
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">Select your pre-announced group</option>
            {GROUP_ROSTER.map(({ id }) => (
              <option key={id} value={id}>Group {id}</option>
            ))}
          </select>

          {mode === "rejoin" && (
            <input
              className={`${input} text-center font-display text-3xl tracking-[.4em]`}
              placeholder="4-digit PIN"
              aria-label="4-digit PIN"
              inputMode="numeric"
              maxLength={4}
              required
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
            {busy ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "register" ? "rejoin" : "register");
              setError("");
            }}
            className="w-full py-2 font-semibold text-royal underline underline-offset-4 hover:text-navy"
          >
            {mode === "register" ? "Already registered? Sign in with PIN" : "New here? Create an account"}
          </button>
        </form>
      </main>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center p-8 font-display text-2xl uppercase tracking-[.2em] text-mute">
          Loading...
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}