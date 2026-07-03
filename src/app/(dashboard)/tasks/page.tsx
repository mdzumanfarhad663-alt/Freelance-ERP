import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TasksView } from "@/components/tasks/tasks-view";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await auth();

  const tasks = await db.task.findMany({
    where: { project: { userId: session!.user.id } },
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, title: true } } },
  });

  return (
    <TasksView
      tasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectId: t.project.id,
        projectTitle: t.project.title,
      }))}
    />
  );
}
