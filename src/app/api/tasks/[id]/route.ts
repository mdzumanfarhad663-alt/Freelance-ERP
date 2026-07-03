import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const parsed = taskUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // Never allow moving a task to a project the user doesn't own
  if (parsed.data.projectId) {
    const project = await db.project.findFirst({
      where: { id: parsed.data.projectId, userId: session.user.id },
    });
    if (!project) return NextResponse.json({ message: "Project not found" }, { status: 400 });
  }

  const { count } = await db.task.updateMany({
    where: { id, project: { userId: session.user.id } },
    data: parsed.data,
  });
  if (count === 0) return NextResponse.json({ message: "Task not found" }, { status: 404 });

  return NextResponse.json(await db.task.findUnique({ where: { id } }));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { count } = await db.task.deleteMany({
    where: { id, project: { userId: session.user.id } },
  });
  if (count === 0) return NextResponse.json({ message: "Task not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
