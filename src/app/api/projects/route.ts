import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectSchema, PROJECT_STATUSES } from "@/lib/validations";
import type { ProjectStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");

  const projects = await db.project.findMany({
    where: {
      userId: session.user.id,
      ...(status && PROJECT_STATUSES.includes(status as ProjectStatus)
        ? { status: status as ProjectStatus }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const parsed = projectSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // Client must belong to the current user
  const client = await db.client.findFirst({
    where: { id: parsed.data.clientId, userId: session.user.id },
  });
  if (!client) return NextResponse.json({ message: "Client not found" }, { status: 400 });

  const project = await db.project.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json(project, { status: 201 });
}
