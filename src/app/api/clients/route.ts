import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Skeleton only — CRUD arrives in Phase 2.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ message: "Not implemented — Phase 2" }, { status: 501 });
}
