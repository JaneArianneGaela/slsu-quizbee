"use client";
import { useEffect, useRef, useState } from "react";

export const GROUP_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function Wheel({
  target,
  spinKey,
  durationMs = 4000,
  size = 280,
}: {
  target: number | null;
  spinKey: number;
  durationMs?: number;
  size?: number;
}) {
  const [rot, setRot] = useState(0);
  const rotRef = useRef(0);

  useEffect(() => {
    if (!target || spinKey === 0) return;
    const center = (target - 1) * 60 + 30; // segment centre, clockwise from top
    const desired = (360 - center) % 360;
    const cur = ((rotRef.current % 360) + 360) % 360;
    const next = rotRef.current + 360 * 4 + ((desired - cur + 360) % 360);
    rotRef.current = next;
    setRot(next);
  }, [spinKey, target]);

  const gradient = `conic-gradient(${GROUP_COLORS.map(
    (c, i) => `${c} ${i * 60}deg ${(i + 1) * 60}deg`
  ).join(",")})`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute left-1/2 z-10"
        style={{
          top: -10,
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "14px solid transparent",
          borderRight: "14px solid transparent",
          borderTop: "26px solid white",
        }}
      />
      <div
        className="absolute inset-0 rounded-full border-4 border-white/80"
        style={{
          background: gradient,
          transform: `rotate(${rot}deg)`,
          transition: `transform ${durationMs}ms cubic-bezier(0.12, 0.8, 0.12, 1)`,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `rotate(${(n - 1) * 60 + 30}deg)` }}
          >
            <span
              className="text-3xl font-extrabold text-white drop-shadow"
              style={{ transform: `translateY(-${size * 0.36}px)` }}
            >
              {n}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}