import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error("Missing Supabase env vars in .env.local");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const raw = JSON.parse(readFileSync("data/questions.seed.json", "utf8"));

const EXPLANATIONS: Record<string, string> = {
  "R1-Q01": "Invert 45 (00101101) and add 1: 11010010 + 1 = 11010011.",
  "R1-Q02": "Integration by parts gives the antiderivative (x - 1)e^x; evaluating from 0 to 1 gives 1.",
  "R1-Q03": "Dry-basis water content is (150 - 120) / 120 x 100 = 25%.",
  "R1-Q04": "For x^x, y' = x^x(ln x + 1); at x = 1 this is 1.",
  "R1-Q05": "The discrimination index measures how well an item separates higher- and lower-scoring test takers.",
  "R1-Q06": "The RC time constant is RC = 10,000 x 47 x 10^-6 = 0.47 seconds.",
  "R1-Q07": "Ba(OH)2 supplies two OH- ions, so [OH-] = 0.02 M; pH = 14 - pOH = 12.30.",
  "R1-Q08": "Urea is 46% nitrogen by mass, so 69 / 0.46 = 150 kg of urea.",
  "R1-Q09": "Using sin^2(x) = (1 - cos(2x))/2, the integral is pi/2, or about 1.57.",
  "R1-Q10": "Kohlberg's post-conventional level bases moral decisions on abstract principles and rights.",
  "R1-Q11": "Carnot efficiency is 1 - Tc/Th = 1 - 300/400 = 0.25, or 25%.",
  "R1-Q12": "P(aa) = 1/4 and P(Bb) = 1/2; independent assortment gives 1/4 x 1/2 = 1/8.",
  "R1-Q13": "Ethylene is the gaseous plant hormone synthesized from ACC that promotes fruit ripening.",
  "R1-Q14": "Cutting speed is pi x diameter x rpm = 3.1416 x 0.1 x 400 = 125.66 m/min.",
  "R1-Q15": "The velocity changes by 10 m/s; impulse magnitude is mass x change in velocity = 0.5 x 10 = 5 N s.",
  "R1-Q16": "Twelve bits provide 2^12 = 4096 addresses, enough for 3000 locations; 11 bits are not enough.",
  "R1-Q17": "The standard limit (1 - cos x)/x^2 as x approaches 0 is 1/2.",
  "R1-Q18": "In E7018, the first two digits specify a minimum tensile strength of 70 ksi.",
  "R1-Q19": "The vertical launch speed is 30 sin(30 degrees) = 15 m/s; height is 15^2/(2 x 10) = 11.25 m.",
  "R1-Q20": "Powers of 3 modulo 7 repeat every 6; 100 leaves remainder 4, and 3^4 mod 7 is 4.",
  "R2-Q01": "The mask leaves 10 host bits, giving 2^10 - 2 = 1022 usable host addresses.",
  "R2-Q02": "There are C(6,4) = 15 ways to choose four heads among 64 equally likely outcomes: 15/64.",
  "R2-Q03": "Net demand is 0.00575 x 30,000 = 172.5 m^3; divide by 0.80 efficiency to get 215.63 m^3.",
  "R2-Q04": "At 0.25 mm/rev and 400 rev/min, feed rate is 100 mm/min; 300 mm takes 3 minutes.",
  "R2-Q05": "Cronbach's alpha estimates internal consistency by measuring how consistently test items relate to one another.",
  "R2-Q06": "Resonance is 1/(2 pi sqrt(LC)); with L = 0.01 H and C = 0.00001 F it is about 503 Hz.",
  "R2-Q07": "Henderson-Hasselbalch gives pH = 4.76 + log10(0.10/0.20) = 4.46.",
  "R2-Q08": "Narrow-sense heritability is additive genetic variance / phenotypic variance = 16/40 = 0.4.",
  "R2-Q09": "Integrating 2xy over y from 0 to x gives x^3; integrating x^3 from 0 to 1 gives 1/4.",
  "R2-Q10": "Acceleration down the incline is g(sin 30 - 0.20 cos 30) = 3.20 m/s^2.",
  "R2-Q11": "For a solid circular shaft, maximum shear stress is 16T/(pi d^3), which gives 61.1 MPa.",
  "R2-Q12": "Expanding the determinant gives 2(-13) - 1(-4) + 3(1) = -19.",
  "R2-Q13": "Porosity is 1 - bulk density/particle density = 1 - 1.3/2.6 = 0.50, or 50%.",
  "R2-Q14": "The transform of t e^(2t) is 1/(s - 2)^2; at s = 5 this is 1/9.",
  "R2-Q15": "Four offset bits address each 16-byte block and six index bits select a cache line; 32 - 4 - 6 = 22 tag bits.",
  "R3-Q01": "Three-phase real power is sqrt(3) x 400 x 20 x 0.8 = 11.09 kW.",
  "R3-Q02": "Split the series into sum(1/2^n) = 2 and sum(n/2^n) = 2; total = 4.",
  "R3-Q03": "The basal fertilizer supplies 0.14 x 200 = 28 kg N; the remaining 92 kg needs 92/0.46 = 200 kg urea.",
  "R3-Q04": "Disk integration gives V = pi integral(x dx) from 0 to 4 = 8 pi, or 25.13 cubic units.",
  "R3-Q05": "The z-score is (91 - 75)/8 = 2; T = 50 + 10z = 70.",
  "R3-Q06": "A 16-to-1 multiplexer needs four 4-to-1 units in the first stage and one in the next: 5 total.",
  "R3-Q07": "Convert entropy to -0.199 kJ/K; delta G = delta H - T delta S = -92 - 298(-0.199) = -32.7 kJ.",
  "R3-Q08": "Dry matter stays 760 kg; at 14% moisture it is 86% of final mass, so 760/0.86 = 883.7 kg.",
  "R3-Q09": "Conduction rate is kA(delta T)/L = 0.5 x 10 x 80 / 0.2 = 2000 W.",
  "R3-Q10": "The mass-spring period is 2 pi sqrt(m/k) = 2 pi sqrt(2/200) = 0.63 seconds.",
  "CL-Q01": "Comparing with s^2 + 2 zeta omega_n s + omega_n^2 gives omega_n = 5 and zeta = 6/(2 x 5) = 0.6.",
  "CL-Q02": "Treat the two people as one block: 7 objects seat in 6! circular arrangements, and the pair can switch places, giving 1440.",
  "CL-Q03": "The fruit contains 15 kg of dry matter; dry matter is 85% of final mass, so final mass is 15/0.85 = 17.65 kg.",
  "CL-Q04": "The solution is y = 2e^x - e^(2x); at x = 1 it is about -1.95.",
  "CL-Q05": "Orbital speed is sqrt(GM/r) = sqrt(4.0 x 10^14 / 7.0 x 10^6) = about 7559 m/s.",
};

const missingExplanations = raw.filter((q: { id: string }) => !EXPLANATIONS[q.id]);
if (missingExplanations.length) {
  throw new Error(`Missing explanations for: ${missingExplanations.map((q: { id: string }) => q.id).join(", ")}`);
}

const rows = raw.map((q: any) => ({
  id: q.id,
  round: q.round,
  order_no: q.order_no,
  source_college: q.source_college ?? null,
  input_mode: q.input_mode,
  prompt: q.prompt,
  options: q.options ?? null,
  correct: String(q.correct).trim().toUpperCase(),
  accepted: (q.accepted ?? []).map((a: string) => String(a).trim().toUpperCase()),
  explanation: EXPLANATIONS[q.id],
  tolerance: q.tolerance ?? 0,
  points: q.points,
  time_limit_s: q.time_limit_s,
  // grading_rule is intentionally ignored
}));

async function main() {
  const { error } = await supabase.from("questions").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`Seeded ${rows.length} questions.`);
}
main().catch((e) => { console.error(e); process.exit(1); });