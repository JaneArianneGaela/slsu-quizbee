export const COLLEGES = ["CEN", "CAS", "CAG", "CIT", "CTE"] as const;
export type College = (typeof COLLEGES)[number];