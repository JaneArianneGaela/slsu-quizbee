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

  // every visual layer scales with `size`
  const rim = size * 0.055;
  const tickInset = size * 0.012;
  const tickInner = size / 2 - tickInset - size * 0.03;
  const tickMask = `radial-gradient(circle, transparent ${tickInner}px, #000 ${tickInner + 0.5}px)`;
  const hub = size * 0.17;

  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label="Group wheel">
      {/* pointer */}
      <div
        className="absolute left-1/2 z-20"
        style={{
          top: -size * 0.04,
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: `${size * 0.05}px solid transparent`,
          borderRight: `${size * 0.05}px solid transparent`,
          borderTop: `${size * 0.095}px solid #FFC93C`,
          filter: `drop-shadow(0 0 ${size * 0.005}px #fff) drop-shadow(0 ${size * 0.012}px ${size * 0.015}px rgba(6,26,74,.6))`,
        }}
      />

      {/* outer rim */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "linear-gradient(145deg, #1D6FE8, #0A2A6B 60%, #061A4A)",
          boxShadow: `0 ${size * 0.04}px ${size * 0.1}px rgba(6,26,74,.55), 0 0 ${size * 0.12}px rgba(41,196,255,.45)`,
        }}
      />

      {/* tick ring */}
      <div
        className="absolute rounded-full"
        style={{
          inset: tickInset,
          background: "repeating-conic-gradient(from -1deg, #FFC93C 0deg 2deg, transparent 2deg 10deg)",
          WebkitMaskImage: tickMask,
          maskImage: tickMask,
        }}
      />

      {/* rotating disc */}
      <div
        className="absolute rounded-full"
        style={{
          inset: rim,
          background: gradient,
          border: `${Math.max(2, size * 0.01)}px solid rgba(255,255,255,.92)`,
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
              className="font-display text-white"
              style={{
                fontSize: size * 0.12,
                lineHeight: 1,
                transform: `translateY(-${size * 0.36}px)`,
                WebkitTextStroke: `${size * 0.008}px rgba(6,26,74,.6)`,
                paintOrder: "stroke fill",
                textShadow: `0 ${size * 0.008}px ${size * 0.02}px rgba(0,0,0,.5)`,
              }}
            >
              {n}
            </span>
          </div>
        ))}
      </div>

      {/* static shine */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: rim,
          background: "radial-gradient(circle at 32% 22%, rgba(255,255,255,.38), transparent 45%)",
        }}
      />

      {/* hub */}
      <div
        className="absolute left-1/2 top-1/2 z-10 flex items-center justify-center rounded-full"
        style={{
          width: hub,
          height: hub,
          transform: "translate(-50%, -50%)",
          background: "linear-gradient(135deg, #FFE08A, #FFC93C 50%, #E0A100)",
          border: `${Math.max(2, size * 0.012)}px solid #fff`,
          boxShadow: `0 ${size * 0.015}px ${size * 0.03}px rgba(6,26,74,.5)`,
        }}
      >
        <span
          className="rounded-full"
          style={{ width: hub * 0.34, height: hub * 0.34, background: "#0A2A6B" }}
        />
      </div>
    </div>
  );
}