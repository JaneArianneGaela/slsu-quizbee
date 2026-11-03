"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { QuizState } from "@/lib/types";

export function useQuizState(publicView = false) {
  const [s, setS] = useState<QuizState | null>(null);
  const [unauth, setUnauth] = useState(false);
  const offset = useRef(0);
  const best = useRef(Infinity);
  const now = useCallback(() => Date.now() + offset.current, []);

  const load = useCallback(async () => {
    const t0 = Date.now();
    try {
      const r = await fetch(publicView ? "/api/state?public=1" : "/api/state", { cache: "no-store" });
      const t1 = Date.now();
      if (r.status === 401) {
        setUnauth(true);
        return;
      }
      if (!r.ok) return;
      const d: QuizState = await r.json();
      const rtt = t1 - t0;
      if (rtt <= best.current + 100) {
        // server-time offset from the fastest round trips
        offset.current = d.serverNow - (t0 + t1) / 2;
        best.current = Math.min(best.current, rtt);
      }
      setUnauth(false);
      setS(d);
    } catch {
      /* keep last state, next poll retries */
    }
  }, [publicView]);

  useEffect(() => {
    load(); // full fetch on load / reconnect
    const poll = setInterval(load, 2000); // fallback
    const ch = supabaseBrowser
      .channel(publicView ? "session-state-public" : "session-state")
      .on("postgres_changes", { event: "*", schema: "public", table: "session_state" }, () => load())
      .subscribe();
    return () => {
      clearInterval(poll);
      supabaseBrowser.removeChannel(ch);
    };
  }, [load, publicView]);

  return { s, unauth, now, load };
}