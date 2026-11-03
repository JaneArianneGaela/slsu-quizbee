"use client";
import { useEffect, useState } from "react";
import { sfx, setSound, isSoundOn, loadSoundPref, unlock, startMusic, stopMusic, musicOn } from "@/lib/sound";

export default function SoundControls({ music = false }: { music?: boolean }) {
  const [on, setOn] = useState(true);
  const [mus, setMus] = useState(false);

  useEffect(() => {
    loadSoundPref(); setOn(isSoundOn());
    const h = (e: PointerEvent) => {
      unlock();
      if ((e.target as HTMLElement).closest("button,a")) sfx.click();
    };
    window.addEventListener("pointerdown", h, true);
    return () => window.removeEventListener("pointerdown", h, true);
  }, []);

  const btn = "grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-base shadow";
  return (
    <>
      <button aria-label="Toggle sound" className={btn + (on ? "" : " opacity-50")}
        onClick={() => { setSound(!on); setOn(!on); if (!on) sfx.select(); }}>
        {on ? "🔊" : "🔇"}
      </button>
      {music && (
        <button aria-label="Toggle music" className={btn + (mus ? " glow-blue" : "")}
          onClick={() => { unlock(); if (musicOn()) { stopMusic(); setMus(false); } else { startMusic(); setMus(true); } }}>
          🎵
        </button>
      )}
    </>
  );
}