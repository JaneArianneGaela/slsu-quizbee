import { NextResponse } from "next/server";
import { getParticipant } from "@/lib/session";

export async function GET() {
  const p = await getParticipant();
  if (!p) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({
    participant: { id: p.id, fullName: p.full_name, college: p.college, groupId: p.group_id, role: p.role },
  });
}