import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectsView } from "@/components/projects/projects-view";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [projects, clients] = await Promise.all([
    db.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
    }),
    db.client.findMany({ where: { userId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <ProjectsView
      clients={clients}
      projects={projects.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        clientId: p.clientId,
        clientName: p.client.name,
        status: p.status,
        budget: p.budget === null ? null : Number(p.budget),
        deadline: p.deadline ? p.deadline.toISOString() : null,
        taskCount: p._count.tasks,
      }))}
    />
  );
}
