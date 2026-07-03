import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Toggle paid/unpaid. Body: { paid: boolean } (defaults to marking paid).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const paid = typeof body.paid === "boolean" ? body.paid : true;

  const { count } = await db.invoice.updateMany({
    where: { id, userId: session.user.id },
    data: { status: paid ? "PAID" : "UNPAID", paidAt: paid ? new Date() : null },
  });
  if (count === 0) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });

  return NextResponse.json(await db.invoice.findUnique({ where: { id } }));
}
