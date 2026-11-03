"use client";
import { useCallback, useEffect, useState } from "react";
import type { QuizState } from "@/lib/types";

export type RevealGroup = {
  groupId: number; label: string; color: string;
  answered: boolean; answer: string | null; correct: boolean;
  points: number; place: number | null;
};
export type StandingRow = {
  groupId: number; label: string; color: string;
  r1: number; r2: number; r3: number; cl: number; main: number; rank: number;
};
export type ResultsData = {
  questionId: string | null;
  phase: string;
  mine: { answer: string; correct?: boolean; points?: number } | null;
  reveal: { groups: RevealGroup[] } | null;
  standings: StandingRow[] | null;
  tied: number[];
};

export function useResults(s: QuizState | null) {
  const [r, setR] = useState<ResultsData | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/results", { cache: "no-store" });
      if (res.ok) setR(await res.json());
    } catch {
      /* keep last data */
    }
  }, []);

  const phase = s?.phase ?? "";
  const qid = s?.question?.id ?? "";
  const index = s?.index ?? -1;

  useEffect(() => {
    if (phase) reload();
  }, [phase, qid, index, reload]);

  useEffect(() => {
    if (!["QUESTION_LIVE", "REVEALED"].includes(phase)) return;
    const t = setInterval(reload, 4000);
    return () => clearInterval(t);
  }, [phase, reload]);

  return { r, reload };
}