import Image from "next/image";
import Link from "next/link";
import { BrandHeader, BrandTicker } from "@/components/BrandHeader";

const SATS: [string, number][] = [
  ["S", 0],
  ["T", -4.5],
  ["E", -9],
  ["M", -13.5],
];

const STATS: [number, string][] = [
  [30, "Scholars"],
  [6, "Groups"],
  [45, "Items"],
  [215, "Max pts"],
];

const SEALS: [string, string, string][] = [
  ["CAG", "Agriculture", "College of Agriculture seal"],
  ["CAS", "Arts and Sciences", "College of Arts and Sciences seal"],
  ["CEN", "Engineering", "College of Engineering seal"],
  ["CIT", "Industrial Technology", "College of Industrial Technology seal"],
  ["CTE", "Teacher Education", "College of Teacher Education seal"],
];

const cardCls =
  "group relative block overflow-hidden rounded-[18px] border border-line bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-aqua hover:shadow-[0_18px_40px_#1D6FE838] active:scale-[.97]";
const icoCls =
  "grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-ice to-[#cfe4ff] text-[21px]";
const arrowCls =
  "absolute right-[18px] top-[18px] -translate-x-2 font-display text-xl text-aqua opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100";

export default function Home() {
  return (
    <>
      <BrandHeader />
      <BrandTicker />
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-16 pt-6">
        <section
          className="glass scan grid items-center gap-10 p-6 md:p-10 lg:grid-cols-[1.15fr_.85fr] lg:gap-11 lg:min-h-[520px]"
          style={{
            backgroundImage:
              "radial-gradient(520px circle at var(--mx,50%) var(--my,-60%), #29C4FF22, transparent 60%), radial-gradient(#1D6FE818 1.2px, transparent 1.4px)",
            backgroundSize: "auto, 22px 22px",
          }}
        >
          <div>
            <p className="eyebrow">SLSU-DOST SA · STEM Quiz Bee</p>
            <h1 className="display">
              Battle of the <em className="hl">Scholar Minds</em>
            </h1>
            <p className="text-base leading-[1.7] text-mute">
              <b className="font-display text-xl font-normal uppercase tracking-[.07em] text-royal">
                November 13, 2026
              </b>{" "}
              · 8:00 AM – 12:00 NN · Lucban, Quezon
              <i className="mt-2.5 block max-w-[34ch] font-serif text-xl italic leading-relaxed text-mute">
                Igniting Intellectual Excellence Through Science, Technology,
                Engineering, and Mathematics
              </i>
            </p>

            <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map(([n, label]) => (
                <div key={label} className="stat">
                  <b>{n}</b>
                  <span>{label.toUpperCase()}</span>
                </div>
              ))}
            </div>

            <div className="grid gap-3.5 md:grid-cols-2">
              <Link href="/host" className={cardCls}>
                <div className={icoCls}>⚙️</div>
                <h2 className="mb-0.5 mt-2 font-display text-[1.7rem] font-normal uppercase tracking-[.05em]">
                  Quiz Master
                </h2>
                <p className="text-[.95rem] text-mute">Run rounds, timer and reveals.</p>
                <span aria-hidden="true" className={arrowCls}>→</span>
              </Link>
              <Link href="/register" className={cardCls}>
                <div className={icoCls}>🧪</div>
                <h2 className="mb-0.5 mt-2 font-display text-[1.7rem] font-normal uppercase tracking-[.05em]">
                  Participant
                </h2>
                <p className="text-[.95rem] text-mute">Register, join your group, answer.</p>
                <span aria-hidden="true" className={arrowCls}>→</span>
              </Link>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="relative mx-auto aspect-square w-[min(380px,80vw)] drop-shadow-[0_20px_40px_#1D6FE833]"
          >
            <div className="absolute inset-0 animate-[orbitSpin_30s_linear_infinite] rounded-full border-2 border-dashed border-[#1D6FE844]" />
            <div className="absolute inset-[14%] animate-[orbitSpin_22s_linear_infinite_reverse] rounded-full border-2 border-dashed border-[#E0A10066]" />
            {SATS.map(([l, d]) => (
              <div
                key={l}
                className="absolute inset-0 animate-[orbitSpin_18s_linear_infinite]"
                style={{ animationDelay: `${d}s` }}
              >
                <b
                  className="absolute -top-[18px] left-1/2 -ml-[22px] grid h-11 w-11 animate-[orbitSpin_18s_linear_infinite_reverse] place-items-center rounded-full bg-gradient-to-br from-royal to-aqua font-display text-[1.1rem] font-normal text-white shadow-[0_6px_16px_#1D6FE866]"
                  style={{ animationDelay: `${d}s` }}
                >
                  {l}
                </b>
              </div>
            ))}
            <div className="absolute inset-[27%] grid animate-[softPulse_4s_ease-in-out_infinite] place-items-center rounded-full bg-white shadow-[0_0_0_8px_#EAF3FF,0_0_60px_#29C4FF88]">
              <Image
                src="/Official_Logo.png"
                alt=""
                width={260}
                height={260}
                className="h-auto w-[86%]"
                priority
              />
            </div>
          </div>
        </section>

        <section className="glass mt-6 grid items-center gap-8 md:grid-cols-[minmax(180px,.6fr)_3fr]">
          <h2 className="font-display text-[clamp(1.8rem,3.4vw,2.6rem)] font-normal uppercase leading-none tracking-[.02em]">
            Scholars from <em className="not-italic text-royal">five colleges</em>
          </h2>
          <div className="grid grid-cols-3 gap-4 md:grid-cols-5 md:gap-2.5">
            {SEALS.map(([code, name, alt], i) => (
              <figure
                key={code}
                className="group m-0 animate-[up_.7s_both] cursor-default text-center transition duration-300 hover:-translate-y-2"
                style={{ animationDelay: `${0.1 * (i + 1)}s` }}
              >
                <Image
                  src={`/${code}.png`}
                  alt={alt}
                  width={104}
                  height={104}
                  className="mx-auto aspect-square w-[min(104px,100%)] object-contain drop-shadow-[0_8px_14px_#0A2A6B33] transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110"
                />
                <figcaption className="mt-2.5 text-[.95rem] font-semibold leading-tight text-navy">
                  {name}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}