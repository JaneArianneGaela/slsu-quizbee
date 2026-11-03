"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { OFFICER_GROUPS } from "@/lib/officers";

type Filter = "all" | (typeof OFFICER_GROUPS)[number]["id"];

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "advisers", label: "Advisers" },
  { id: "exec", label: "Executive" },
  { id: "comm", label: "Committees" },
  { id: "col", label: "Colleges" },
];

export default function OfficersButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  // Esc to close, lock page scroll while open, focus the close button
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      openerRef.current?.focus();
    };
  }, [open]);

  const groups = OFFICER_GROUPS.filter((g) => filter === "all" || g.id === filter);
  const total = OFFICER_GROUPS.reduce((n, g) => n + g.members.length, 0);

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-1.5 rounded-full border-2 border-line bg-white/80 font-display uppercase tracking-[.12em] text-royal transition hover:-translate-y-0.5 hover:border-aqua hover:shadow-[0_8px_20px_#1D6FE82a] ${
          compact ? "min-h-8 px-3 text-xs" : "min-h-10 px-4 text-sm"
        }`}
      >
        <span aria-hidden>👥</span>
        <span>Officers</span>
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-[#061A4A]/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="SLSU-DOST SA officers"
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white text-navy shadow-[0_30px_80px_#0A2A6B66] sm:rounded-2xl"
              style={{ animation: "up .35s ease backwards" }}
            >
              <div className="h-1 w-full flex-none shrink-0 bg-gradient-to-r from-royal to-aqua" />

              <div className="flex flex-none shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-4 sm:px-7">
                <div>
                  <p className="eyebrow">SLSU-DOST SA · A.Y. 2026–2027</p>
                  <h2 className="font-display text-3xl uppercase tracking-wide text-navy-deep sm:text-4xl">
                    Meet the <span className="text-royal">Officers</span>
                  </h2>
                  <p className="text-sm font-semibold text-mute">{total} people behind the Battle of the Scholar Minds</p>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close officers"
                  className="grid h-11 w-11 flex-none place-items-center rounded-full border-2 border-line bg-white text-2xl leading-none text-navy transition hover:border-aqua hover:text-royal"
                >
                  ×
                </button>
              </div>

              <div className="flex flex-none shrink-0 gap-2 overflow-x-auto px-5 pb-4 pt-1 sm:px-7" role="tablist" aria-label="Filter officers">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === f.id}
                    onClick={() => setFilter(f.id)}
                    className={`flex-none rounded-full px-4 py-2 font-display text-sm uppercase tracking-[.12em] transition ${
                      filter === f.id
                        ? "bg-gradient-to-br from-royal to-[#4C9BFF] text-white shadow-[0_6px_18px_#1D6FE860]"
                        : "bg-ice text-mute hover:text-royal"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 space-y-7 overflow-y-auto px-5 pb-7 pt-2 sm:px-7">
                {groups.map((g) => (
                  <section key={g.id} aria-label={g.title}>
                    <h3 className="mb-3 flex items-center gap-2 font-display text-xl uppercase tracking-[.08em] text-navy-deep">
                      {g.title}
                      <span className="rounded-full bg-royal px-2.5 py-0.5 text-xs tracking-widest text-white">
                        {g.members.length}
                      </span>
                    </h3>
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {g.members.map((m) => (
                        <li
                          key={m.name}
                          className="rounded-2xl border border-line bg-white p-3 text-center shadow-[0_6px_18px_#1D6FE814] transition hover:-translate-y-1 hover:border-aqua hover:shadow-[0_14px_30px_#1D6FE838]"
                        >
                          <Image
                            src={`/officers/${m.photo}`}
                            alt={m.name}
                            width={160}
                            height={160}
                            className="mx-auto aspect-square w-full max-w-[140px] rounded-xl object-cover shadow-[0_4px_12px_#0A2A6B33]"
                          />
                          <p className="mt-2.5 text-[.95rem] font-extrabold leading-tight text-navy">{m.name}</p>
                          <p className="mt-1 text-xs font-semibold leading-snug text-mute">{m.role}</p>
                          {m.note && (
                            <span className="mt-1.5 inline-block rounded-full bg-gold-soft px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-navy-deep">
                              {m.note}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}