import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const parsed = projectSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const client = await db.client.findFirst({
    where: { id: parsed.data.clientId, userId: session.user.id },
  });
  if (!client) return NextResponse.json({ message: "Client not found" }, { status: 400 });

  const { count } = await db.project.updateMany({
    where: { id, userId: session.user.id },
    data: parsed.data,
  });
  if (count === 0) return NextResponse.json({ message: "Project not found" }, { status: 404 });

  return NextResponse.json(await db.project.findUnique({ where: { id } }));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { count } = await db.project.deleteMany({ where: { id, userId: session.user.id } });
  if (count === 0) return NextResponse.json({ message: "Project not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
