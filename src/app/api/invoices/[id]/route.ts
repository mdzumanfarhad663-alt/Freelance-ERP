import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoiceSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await db.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: { client: true, project: true },
  });
  if (!invoice) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });

  return NextResponse.json(invoice);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const parsed = invoiceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const client = await db.client.findFirst({
    where: { id: parsed.data.clientId, userId: session.user.id },
  });
  if (!client) return NextResponse.json({ message: "Client not found" }, { status: 400 });

  if (parsed.data.projectId) {
    const project = await db.project.findFirst({
      where: { id: parsed.data.projectId, userId: session.user.id },
    });
    if (!project) return NextResponse.json({ message: "Project not found" }, { status: 400 });
  }

  const existing = await db.invoice.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });

  const updated = await db.invoice.update({
    where: { id },
    data: {
      ...parsed.data,
      paidAt:
        parsed.data.status === "PAID" ? existing.paidAt ?? new Date() : null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { count } = await db.invoice.deleteMany({ where: { id, userId: session.user.id } });
  if (count === 0) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
