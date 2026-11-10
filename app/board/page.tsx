"use client";
import QuestionScreen from "@/components/QuestionScreen";
import { BrandHeader } from "@/components/BrandHeader";
import MechanicsButton from "@/components/MechanicsButton";
import { useQuizState } from "@/lib/useQuizState";

function Frame({ children, lock = false }: { children: React.ReactNode; lock?: boolean }) {
  return (
    <div className={`flex min-h-dvh flex-col text-navy ${lock ? "h-dvh overflow-hidden" : ""}`}>
      <BrandHeader compact officers={false} music={false} />
      {children}
    </div>
  );
}

export default function BoardPage() {
  const { s, now } = useQuizState(true); // public view: never receives the answer early

  if (!s)
    return (
      <Frame>
        <main className="grid flex-1 place-items-center p-8 font-display text-4xl uppercase tracking-[.2em] text-mute">
          Loading...
        </main>
      </Frame>
    );

  if (["QUESTION_LIVE", "REVEALED"].includes(s.phase) && s.question) {
    return (
      <Frame>
        <main className="mx-auto w-full max-w-[110rem] flex-1 space-y-6 px-8 py-5">
          <div className="flex justify-end">
            <MechanicsButton />
          </div>
          <QuestionScreen s={s} now={now} sound />
        </main>
      </Frame>
    );
  }

  if (s.phase === "FINAL") {
    return (
      <Frame>
        <main className="grid flex-1 place-items-center p-8 text-center">
          <p className="font-display text-4xl uppercase tracking-[.15em] text-navy-deep">The quiz has ended</p>
        </main>
      </Frame>
    );
  }

  if (s.phase === "ROUND_SCOREBOARD") {
    return (
      <Frame>
        <main className="grid flex-1 place-items-center p-8 text-center">
          <p className="font-display text-4xl uppercase tracking-[.15em] text-navy-deep">
            Round complete — waiting for the next question
          </p>
        </main>
      </Frame>
    );
  }

  return (
    <Frame lock>
      <main className="dotgrid relative flex min-h-0 flex-1 flex-col items-center justify-center gap-[2.2vh] px-8 text-center">
        <p className="eyebrow !text-2xl">SLSU-DOST SA STEM QUIZ BEE</p>
        <h1 className="display !my-0 !text-[clamp(3.5rem,9vh,7.5rem)] text-navy-deep">
          Battle of the <span className="hl">Scholar Minds</span>
        </h1>

        <p className="font-display text-3xl uppercase tracking-[.2em] text-navy-deep">
          The quiz will begin soon
        </p>
      </main>
    </Frame>
  );
}