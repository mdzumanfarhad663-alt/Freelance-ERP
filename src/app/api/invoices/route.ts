import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoiceSchema, INVOICE_STATUSES } from "@/lib/validations";
import type { InvoiceStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");

  const invoices = await db.invoice.findMany({
    where: {
      userId: session.user.id,
      ...(status && INVOICE_STATUSES.includes(status as InvoiceStatus)
        ? { status: status as InvoiceStatus }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

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

  const invoice = await db.invoice.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      paidAt: parsed.data.status === "PAID" ? new Date() : null,
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
