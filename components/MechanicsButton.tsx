"use client";
import { useEffect, useState } from "react";
import { GROUP_ROSTER, ROUND_MECHANICS } from "@/lib/constants";

export default function MechanicsButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button className="btn-ghost" onClick={() => setOpen(true)} aria-haspopup="dialog">
        Mechanics
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-navy-deep/80 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mechanics-title"
            className="glass max-h-[85dvh] w-full max-w-3xl space-y-6 overflow-y-auto"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Participant guide</p>
                <h2 id="mechanics-title" className="font-display text-4xl uppercase text-navy-deep">
                  Quiz Mechanics
                </h2>
              </div>
              <button
                className="grid h-10 w-10 flex-none place-items-center rounded-full border border-line bg-white text-xl font-bold"
                onClick={() => setOpen(false)}
                aria-label="Close mechanics"
              >
                ×
              </button>
            </header>

            <p className="rounded-xl bg-ice p-3 font-semibold text-navy">
              November 13, 2026 · 8:00 AM–12:00 NN · Lucban, Quezon · Google Meet and the live quiz app
            </p>
            <section className="space-y-3">
              <h3 className="font-display text-2xl uppercase text-navy-deep">Format and scoring</h3>
              <div className="overflow-x-auto rounded-xl border border-line bg-white">
                <table className="w-full min-w-[28rem] text-left">
                  <thead className="bg-ice text-sm uppercase text-mute">
                    <tr>
                      <th className="p-3">Round</th>
                      <th className="p-3">Questions</th>
                      <th className="p-3">Points each</th>
                      <th className="p-3">Time each</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROUND_MECHANICS.map((round) => (
                      <tr key={round.name} className="border-t border-line">
                        <th className="p-3">{round.name}</th>
                        <td className="p-3">{round.questions}</td>
                        <td className="p-3">{round.points}</td>
                        <td className="p-3">{round.seconds} seconds</td>
                      </tr>
                    ))}
                    <tr className="border-t border-line font-bold">
                      <th className="p-3">Total</th>
                      <td className="p-3">45</td>
                      <td className="p-3" colSpan={2}>215 points, plus a clincher if needed</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="font-medium text-navy">
                The Quiz Masters control the server timer. Answers are revealed after each question,
                and a scoreboard is shown at the end of every round.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-display text-2xl uppercase text-navy-deep">Event-day setup</h3>
              <ul className="list-disc space-y-1 pl-6 font-medium text-navy">
                <li>The main Google Meet is for all participants.</li>
                <li>Each group has a breakout room with two Quiz Masters and its four members.</li>
                <li>Group Messenger chats carry updates and links; keep notifications on.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-display text-2xl uppercase text-navy-deep">Teamwork and answers</h3>
              <ul className="list-disc space-y-1 pl-6 font-medium text-navy">
                <li>Each group chooses one Representative to enter and submit its answer in the quiz app.</li>
                <li>Members solve the question together; only the Representative can submit for the group.</li>
                <li>All answers are typed. For a multiple-choice question, type the displayed option letter.</li>
                <li>Late answers are not accepted. The answer key is revealed after each question.</li>
                <li>If groups are tied for a prize position after Round 3, the first group to submit a correct clincher answer wins.</li>
                <li>If no group answers a clincher correctly, the next clincher question is played.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-display text-2xl uppercase text-navy-deep">Rules and materials</h3>
              <ul className="list-disc space-y-1 pl-6 font-medium text-navy">
                <li>Keep your camera on and paper and ballpen visible on camera.</li>
                <li>Scientific or standard calculators are allowed. Bring paper and a ballpen.</li>
                <li>No phones or AI tools. Stay fullscreen; copy and paste are disabled.</li>
                <li>Tab switching may be monitored during the event; Messenger and Google Meet are permitted.</li>
                <li>Communicate answers in Google Meet by speaking or writing on paper visible on camera.</li>
                <li>If disconnected, refresh and rejoin with your name and PIN, then notify the Quiz Masters in your group chat.</li>
                <li>Be on time and test your laptop and connection before the event.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="font-display text-2xl uppercase text-navy-deep">Pre-announced groups</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {GROUP_ROSTER.map((group) => (
                  <div key={group.id} className="rounded-xl border border-line bg-white p-3">
                    <h4 className="font-display text-lg uppercase text-royal">Group {group.id}</h4>
                    <ul className="mt-1 space-y-1 text-sm font-medium text-navy">
                      {group.members.map(([name, college]) => (
                        <li key={name}>{name} <span className="text-mute">({college})</span></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-display text-2xl uppercase text-navy-deep">Covered topics</h3>
              <ul className="list-disc space-y-1 pl-6 font-medium text-navy">
                <li><strong>CEN:</strong> Digital logic and computer architecture; RC, RLC, and three-phase circuits; networking; thermodynamics and heat transfer; strength of materials; control systems.</li>
                <li><strong>CAS:</strong> Calculus; probability and combinatorics; linear algebra; number theory; general and physical chemistry; genetics.</li>
                <li><strong>CAg:</strong> Soil science and fertilizer computations; irrigation; plant breeding and heritability; plant physiology; post-harvest and crop drying.</li>
                <li><strong>CIT:</strong> Differential and integral calculus; differential equations; Laplace transforms; machining and shop computations; welding technology.</li>
                <li><strong>CTE:</strong> Educational assessment; developmental theories; physics including motion, impulse, oscillations, and orbits.</li>
              </ul>
              <p className="rounded-xl bg-ice p-3 text-sm font-semibold text-navy">
                This is a college-level STEM quiz bee with calculations. Practice solving quickly;
                Round 1 allows only 30 seconds per question.
              </p>
            </section>
          </section>
        </div>
      )}
    </>
  );
}
