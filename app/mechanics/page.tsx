import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandHeader, BrandTicker } from "@/components/BrandHeader";

export const metadata: Metadata = {
  title: "Contest Mechanics · Battle of the Scholar Minds",
  description:
    "Contest guidelines, team setup, attendance and attire, arbiters, scope and awards for the SLSU-DOST SA STEM Quiz Bee, November 13, 2026.",
};

/* ───────── Content (edit here) ───────── */

const NAV: [string, string][] = [
  ["guidelines", "Contest guidelines"],
  ["team", "The competing entry"],
  ["attendance", "Attendance and attire"],
  ["arbiters", "Board of arbiters"],
  ["scope", "Scope"],
  ["awards", "Awards"],
];

// 20 + 15 + 10 items. Points x items = 60 + 75 + 80 = 215.
const ROUNDS = [
  { level: "Easy", items: 20, pts: 3, secs: 30 },
  { level: "Moderate", items: 15, pts: 5, secs: 60 },
  { level: "Difficult", items: 10, pts: 8, secs: 120 },
];

const RULES: string[] = [
  "The quiz is held online on November 13, 2026, 8:00 AM to 12:00 NN. Discussion happens in Google Meet; the quiz itself runs in this site.",
  "One Quiz Master controls the flow. Every participant sees each question at the same moment, and the timer is held by the server so every screen matches.",
  "Scoring is per group, not per person. Each group may submit one answer per question.",
  "Only the group’s Answerer can submit. Viewers read the question and tell the Answerer by speaking in Google Meet.",
  "Every answer is typed in CAPITAL LETTERS, and each question limits which keys are allowed.",
  "Answers are checked against the answer key and its listed accepted variants. There is no fuzzy matching. Numeric tolerance applies only where a question defines it.",
  "When time runs out, input closes and late answers are rejected. Anything typed but not yet submitted is sent automatically at zero.",
  "The Quiz Master reveals the answer, then each group sees whether it was correct and its current place for about 5 seconds.",
  "Round scoreboards are shown at the end of each round, revealed from last place to first.",
  "Places rank by total points, then number of correct answers, then lower total answering time.",
  "If a prize position is tied, the Quiz Master may run the Clincher for only the tied groups: 5 items, 60 seconds each.",
  "For a protest on an answer, the Quiz Master can mark that submission correct or wrong using Manual Override.",
];

const CONDUCT: string[] = [
  "Camera on in Google Meet for the whole quiz.",
  "Paper and ballpen visible on camera.",
  "No phones, no second device, and no AI tools.",
  "One device per member.",
  "No copying, pasting, right-click or text selection on questions and answers. Paste into the answer box is blocked.",
  "Stay in fullscreen. Tab switches and fullscreen exits are logged for the judges to review; nothing is penalized automatically.",
  "A faint watermark of your name appears on the question screen, and screenshots are logged where the browser allows.",
];

const COLLEGES: [string, string, number][] = [
  ["CEN", "Engineering", 18],
  ["CAS", "Arts and Sciences", 7],
  ["CAG", "Agriculture", 3],
  ["CIT", "Industrial Technology", 0],
  ["CTE", "Teacher Education", 2],
];

const INPUTS: [string, string][] = [
  ["Multiple choice", "Tap A, B, C or D. No keyboard."],
  ["Number", "Digits, minus sign and decimal point."],
  ["Fraction", "Digits and the slash, like 3/8."],
  ["IPv4 address", "Digits and dots."],
  ["Text", "Letters, digits, spaces and hyphen."],
  ["List", "Letters, digits and commas."],
];

// Add names as they are confirmed. An empty list shows "Names to be announced".
const ARBITERS: { role: string; duty: string; names: string[] }[] = [
  {
    role: "Quiz Master",
    duty: "Runs the program from the host console: starts each question, reveals answers, shows scoreboards and starts the Clincher. Can pause the timer, add time, reassign an Answerer and apply Manual Override on a protest.",
    names: [],
  },
  {
    role: "Proctors",
    duty: "One in each Google Meet room. Check that cameras are on, paper and ballpen are visible, and phones are put away.",
    names: [],
  },
  {
    role: "Judges",
    duty: "Agree on the tab-switch review threshold before the event and review the integrity log. Viewers who open Google Meet on the same laptop will trigger tab-switch logs, so the threshold matters.",
    names: [],
  },
];

const PRIZES: { place: string; medal: string; amount: string; hi: string; mid: string; lo: string }[] = [
  { place: "1st place", medal: "🥇", amount: "₱1,500", hi: "#FFE9A0", mid: "#FFC93C", lo: "#B07C00" },
  { place: "2nd place", medal: "🥈", amount: "₱1,250", hi: "#F7F9FC", mid: "#C3CCDA", lo: "#7F8CA1" },
  { place: "3rd place", medal: "🥉", amount: "₱1,000", hi: "#F5C497", mid: "#D08A4A", lo: "#8A4B1C" },
];

/* ───────── Layout helpers ───────── */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="glass scroll-mt-28 space-y-5 text-navy">
      <h2
        id={`${id}-h`}
        className="font-display text-3xl font-normal uppercase tracking-[.05em] text-navy-deep md:text-4xl"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Checks({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex gap-3 leading-relaxed">
          <span
            aria-hidden
            className="mt-1 grid h-5 w-5 flex-none place-items-center rounded-full bg-ice text-xs font-bold text-royal"
          >
            ✓
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/* ───────── Page ───────── */

export default function Mechanics() {
  const totalItems = ROUNDS.reduce((n, r) => n + r.items, 0);
  const maxPts = ROUNDS.reduce((n, r) => n + r.items * r.pts, 0);

  return (
    <>
      <BrandHeader>
        <Link href="/" className="btn-ghost !min-h-10 !px-4 !py-2 !text-sm">
          Home
        </Link>
      </BrandHeader>
      <BrandTicker />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-16 pt-6">
        <div className="mb-6 space-y-2 px-1">
          <p className="eyebrow">Contest mechanics</p>
          <h1 className="display !my-0 !text-[clamp(2.4rem,6vw,4.6rem)]">Battle of the Scholar Minds</h1>
          <p className="max-w-[60ch] text-mute">
            SLSU-DOST SA STEM Quiz Bee · November 13, 2026 · 8:00 AM to 12:00 NN · Lucban, Quezon
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
          {/* section nav */}
          <nav aria-label="Mechanics sections" className="lg:sticky lg:top-24 lg:self-start">
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {NAV.map(([id, label]) => (
                <li key={id} className="flex-none">
                  <a
                    href={`#${id}`}
                    className="block rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-bold text-navy transition hover:border-aqua hover:text-royal lg:rounded-xl"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-6">
            {/* 1 · guidelines */}
            <Section id="guidelines" title="Contest guidelines">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left">
                  <caption className="sr-only">Rounds, items, points and time limits</caption>
                  <thead className="text-sm font-bold uppercase tracking-widest text-mute">
                    <tr>
                      <th className="p-2">Round</th>
                      <th className="p-2 text-right">Items</th>
                      <th className="p-2 text-right">Points each</th>
                      <th className="p-2 text-right">Time each</th>
                      <th className="p-2 text-right">Round total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROUNDS.map((r) => (
                      <tr key={r.level} className="border-t border-royal/15">
                        <th scope="row" className="p-2 font-display text-xl font-normal uppercase tracking-wide">
                          {r.level}
                        </th>
                        <td className="p-2 text-right tabular-nums">{r.items}</td>
                        <td className="p-2 text-right tabular-nums">{r.pts}</td>
                        <td className="p-2 text-right tabular-nums">{r.secs} s</td>
                        <td className="p-2 text-right tabular-nums">{r.items * r.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-royal/30 font-bold">
                      <th scope="row" className="p-2 font-display text-xl font-normal uppercase tracking-wide">
                        Main rounds
                      </th>
                      <td className="p-2 text-right tabular-nums">{totalItems}</td>
                      <td className="p-2" />
                      <td className="p-2" />
                      <td className="p-2 text-right font-display text-2xl font-normal tabular-nums text-royal">
                        {maxPts}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="text-sm text-mute">
                Clincher items are 60 seconds each and are used only to break ties.
              </p>

              <Checks items={RULES} />

              <div className="rounded-2xl border border-line bg-ice/60 p-5">
                <h3 className="mb-3 font-display text-xl font-normal uppercase tracking-[.06em] text-navy-deep">
                  Conduct and integrity
                </h3>
                <Checks items={CONDUCT} />
                <p className="mt-4 text-sm text-mute">
                  A website cannot detect phones, a second device or AI on another screen. The proctor in each Google
                  Meet room covers that part.
                </p>
              </div>
            </Section>

            {/* 2 · team */}
            <Section id="team" title="The competing entry">
              <p className="leading-relaxed">
                30 DOST scholars from SLSU compete as <b>6 groups of 5</b>. Groups are mixed across colleges and are
                drawn on the Spin the Wheel screen. Scholars cannot choose their group.
              </p>

              <div className="grid gap-3 sm:grid-cols-5">
                {COLLEGES.map(([code, name, n]) => (
                  <div
                    key={code}
                    className={`rounded-2xl border border-line bg-white p-4 text-center ${n === 0 ? "opacity-55" : ""}`}
                  >
                    <div className="font-display text-4xl font-normal tabular-nums text-royal">{n}</div>
                    <div className="font-display text-sm tracking-[.14em] text-navy-deep">{code}</div>
                    <div className="mt-1 text-xs font-semibold leading-snug text-mute">{name}</div>
                  </div>
                ))}
              </div>

              <ul className="space-y-2.5 leading-relaxed">
                <li>
                  <b>Registration.</b> Each scholar enters a full name and college and receives a 4-digit PIN. To rejoin
                  after a refresh or lost connection, use your name and PIN. A duplicate name and college is blocked.
                </li>
                <li>
                  <b>Fair draw.</b> The server shuffles each college, then deals them round-robin across the 6 groups, so
                  every group has 5 members and every college is within one member of even.
                </li>
                <li>
                  <b>Roles.</b> Each group has exactly one Answerer. Everyone else is a Viewer. The Answerer is the only
                  person who sees the answer box.
                </li>
                <li>
                  <b>Lobby.</b> Once roles are set, wait for the Quiz Master to start.
                </li>
              </ul>
            </Section>

            {/* 3 · attendance and attire */}
            <Section id="attendance" title="Contest attendance and attire">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-line bg-white p-5">
                  <h3 className="mb-2 font-display text-xl font-normal uppercase tracking-[.06em] text-navy-deep">
                    Attendance
                  </h3>
                  <ul className="space-y-2 leading-relaxed">
                    <li>Join from your own laptop. Attendance is online through Google Meet and this site.</li>
                    <li>Registration opens about 30 minutes before the program starts.</li>
                    <li>Keep your camera on from start to finish, with paper and ballpen visible.</li>
                    <li>Click Enable sound and go fullscreen before the first question.</li>
                    <li>If you get stuck, refresh and rejoin with your name and PIN.</li>
                  </ul>
                </div>
                <div className="rounded-2xl border-2 border-gold bg-[#FFF8E1] p-5">
                  <h3 className="mb-2 font-display text-xl font-normal uppercase tracking-[.06em] text-navy-deep">
                    Attire
                  </h3>
                  <p className="font-display text-3xl font-normal uppercase leading-tight tracking-wide text-navy-deep">
                    Decent casual
                  </p>
                  <p className="mt-2 leading-relaxed">
                    Casual is fine, but the clothing must be decent. You will be on camera the whole time.
                  </p>
                </div>
              </div>
            </Section>

            {/* 4 · arbiters */}
            <Section id="arbiters" title="Board of arbiters">
              <div className="grid gap-4 md:grid-cols-3">
                {ARBITERS.map((a) => (
                  <article key={a.role} className="flex flex-col rounded-2xl border border-line bg-white p-5">
                    <h3 className="font-display text-2xl font-normal uppercase tracking-[.05em] text-navy-deep">
                      {a.role}
                    </h3>
                    <p className="mt-2 flex-1 text-[.95rem] leading-relaxed text-mute">{a.duty}</p>
                    <div className="mt-4 border-t border-royal/15 pt-3 text-sm font-bold">
                      {a.names.length ? (
                        <ul className="space-y-0.5">
                          {a.names.map((n) => (
                            <li key={n}>{n}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="font-semibold text-mute">Names to be announced</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </Section>

            {/* 5 · scope */}
            <Section id="scope" title="Scope">
              <p className="leading-relaxed">
                <b>Science, Technology, Engineering and Mathematics.</b> Questions are drawn from the fields of the five
                colleges: Agriculture, Arts and Sciences, Engineering, Industrial Technology and Teacher
                Education. There are {totalItems} main items across three difficulty levels, plus 5 Clincher items held in
                reserve for ties.
              </p>
              <div>
                <h3 className="mb-3 font-display text-xl font-normal uppercase tracking-[.06em] text-navy-deep">
                  Answer formats
                </h3>
                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {INPUTS.map(([k, v]) => (
                    <div key={k} className="rounded-2xl border border-line bg-white p-4">
                      <dt className="font-extrabold text-navy">{k}</dt>
                      <dd className="mt-0.5 text-sm text-mute">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Section>

            {/* 6 · awards */}
            <Section id="awards" title="Awards">
              <ol className="grid items-end gap-4 md:grid-cols-3">
                {PRIZES.map((p, i) => (
                  <li
                    key={p.place}
                    className={`flex flex-col items-center justify-end gap-1 rounded-2xl p-6 text-center text-navy-deep ${
                      i === 0 ? "md:order-2 md:min-h-64" : i === 1 ? "md:order-1 md:min-h-52" : "md:order-3 md:min-h-44"
                    }`}
                    style={{
                      background: `linear-gradient(180deg, ${p.hi}, ${p.mid} 45%, ${p.lo})`,
                      boxShadow:
                        "inset 0 3px 0 #ffffffaa, inset 0 -14px 24px #0000003a, 0 18px 28px -10px #0A2A6B66",
                    }}
                  >
                    <span className="text-5xl" aria-hidden>
                      {p.medal}
                    </span>
                    <span className="font-display text-xl uppercase tracking-[.12em]">{p.place}</span>
                    <span className="font-display text-5xl tabular-nums">{p.amount}</span>
                  </li>
                ))}
              </ol>
              <p className="text-sm text-mute">
                Places follow the final standings: total points, then number of correct answers, then lower total
                answering time.
              </p>
            </Section>
          </div>
        </div>
      </main>
    </>
  );
}
