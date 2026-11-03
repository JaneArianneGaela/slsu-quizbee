export type Member = { id: string; name: string; college: string; role: "VIEWER" | "ANSWERER" | null };
export type Group = { id: number; label: string; color: string; members: Member[] };

export type Question = {
  id: string;
  round: string;
  number: number;
  totalInRound: number;
  inputMode: string;
  prompt: string;
  options: Record<string, string> | null;
  points: number;
  timeLimitS: number;
  correct?: string;     // only present at reveal (or for the QM)
  accepted?: string[];
};

export type QuizState = {
  phase: string;
  effectivePhase: string;
  registrationOpen: boolean;
  spinAt: string | null;
  registered: number;
  isQm: boolean;
  me: {
    id: string;
    fullName: string;
    college: string;
    groupId: number | null;
    role: "VIEWER" | "ANSWERER" | null;
  } | null;
  groups: Group[];
  groupsReady: number;
  serverNow: number;
  deadlineMs: number | null;
  pausedRemainingMs: number | null;
  question: Question | null;
  clincherGroups: number[] | null;
  index: number;
  totalQuestions: number;
};