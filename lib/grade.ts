export const MAX_LEN = 60;

// Keeps only the characters allowed for each input mode, in UPPERCASE.
export function sanitizeInput(mode: string, raw: string): string {
  const up = raw.toUpperCase();
  let out: string;
  switch (mode) {
    case "NUMBER":   out = up.replace(/[^0-9.\-]/g, ""); break;
    case "FRACTION": out = up.replace(/[^0-9/\-]/g, ""); break;
    case "IPV4":     out = up.replace(/[^0-9.]/g, ""); break;
    case "CHOICE":   out = up.replace(/[^A-D]/g, "").slice(0, 1); break;
    case "TEXT":     out = up.replace(/[^A-Z0-9 .'\-]/g, ""); break;
    case "LIST":     out = up.replace(/[^A-Z0-9 ,;=.\-]/g, ""); break;
    default:         out = "";
  }
  return out.slice(0, MAX_LEN);
}

function norm(mode: string, s: string) {
  let t = s.toUpperCase().trim();
  if (mode === "TEXT") {
    t = t.replace(/[₀-₉]/g, "").replace(/\./g, "").replace(/\s+/g, " ");
  } else {
    t = t.replace(/\s+/g, "");
  }
  return t;
}

type GradeQ = {
  input_mode: string;
  correct: string;
  accepted: string[];
  tolerance: number | string;
};

export function grade(q: GradeQ, raw: string): boolean {
  const a = norm(q.input_mode, raw);
  if (!a) return false;
  const valid = new Set([q.correct, ...q.accepted].map((v) => norm(q.input_mode, v)));
  if (valid.has(a)) return true;

  if (q.input_mode === "NUMBER" && /^-?\d*\.?\d+$/.test(a)) {
    const x = Number(a);
    const target = Number(q.correct);
    const tol = Number(q.tolerance) || 0;
    if (Number.isFinite(x) && Number.isFinite(target)) {
      return Math.abs(x - target) <= tol + 1e-9;
    }
  }
  return false;
}