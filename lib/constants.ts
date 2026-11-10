export const COLLEGES = ["CEN", "CAS", "CAG", "CIT", "CTE"] as const;
export type College = (typeof COLLEGES)[number];

export const GROUP_ROSTER = [
  {
    id: 1,
    members: [
      ["Ryan Christian Vergara", "CEN"],
      ["Jeffrey Abuyan", "CEN"],
      ["Ednalyn Marie Jane Cosejo", "CAS"],
      ["Jisselle Reyes", "CAG"],
    ],
  },
  {
    id: 2,
    members: [
      ["Ryza Anne Ramos", "CEN"],
      ["Jed Austin Sarmiento", "CEN"],
      ["Crismel Adrian Montes", "CAS"],
      ["Faith Leslie Avenilla", "CAG"],
    ],
  },
  {
    id: 3,
    members: [
      ["John Michael Carta", "CEN"],
      ["Hannah Pauline Averia", "CEN"],
      ["John Paul Bantoc", "CAS"],
      ["Faith Angela Lagaya", "CAG"],
    ],
  },
  {
    id: 4,
    members: [
      ["Reign Francheska Louise de Villa", "CEN"],
      ["Christine Bacalo", "CEN"],
      ["Julia Beatrice Bungalon", "CAS"],
      ["Mark Rayven Medina", "CTE"],
    ],
  },
  {
    id: 5,
    members: [
      ["Joshua Miguel Bartina", "CEN"],
      ["Tristan Ankristel Uy", "CEN"],
      ["Dan Dave Niño Mendoza", "CAS"],
      ["Jemuel Pagapong", "CTE"],
    ],
  },
  {
    id: 6,
    members: [
      ["Andrie Justine Manalo", "CEN"],
      ["Kalvin Elbert Nombrado", "CEN"],
      ["Mark Jasper Enardecido", "CEN"],
      ["Arman Ragudo", "CAS"],
    ],
  },
  {
    id: 7,
    members: [
      ["Earl Lorenz John Daray", "CEN"],
      ["Sharmaine Llian Madrid", "CEN"],
      ["Miguel Antonio Avillo", "CEN"],
      ["Justine Jhay Saludes", "CAS"],
    ],
  },
] as const;

export const ROUND_MECHANICS = [
  { name: "Round 1", questions: 20, points: 3, seconds: 30 },
  { name: "Round 2", questions: 15, points: 5, seconds: 60 },
  { name: "Round 3", questions: 10, points: 8, seconds: 120 },
] as const;

export function officialGroupFor(fullName: string, college: string): number | undefined {
  const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
  const normalizedName = normalize(fullName);
  return GROUP_ROSTER.find(({ members }) =>
    members.some(([name, department]) =>
      department === college && normalize(name) === normalizedName
    )
  )?.id;
}