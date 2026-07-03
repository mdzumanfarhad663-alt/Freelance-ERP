import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskSchema, TASK_STATUSES } from "@/lib/validations";
import type { TaskStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("projectId");
  const status = req.nextUrl.searchParams.get("status");

  const tasks = await db.task.findMany({
    where: {
      project: { userId: session.user.id },
      ...(projectId ? { projectId } : {}),
      ...(status && TASK_STATUSES.includes(status as TaskStatus) ? { status: status as TaskStatus } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, title: true } } },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const parsed = taskSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // Project must belong to the current user
  const project = await db.project.findFirst({
    where: { id: parsed.data.projectId, userId: session.user.id },
  });
  if (!project) return NextResponse.json({ message: "Project not found" }, { status: 400 });

  const task = await db.task.create({ data: parsed.data });

  return NextResponse.json(task, { status: 201 });
}
