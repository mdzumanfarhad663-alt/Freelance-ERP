import Link from "next/link";
import { Users, FolderKanban, CheckCircle2, ListChecks, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES, formatDate } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [clientCount, activeProjects, completedProjects, totalTasks, pendingTasks, recentProjects] =
    await Promise.all([
      db.client.count({ where: { userId } }),
      db.project.count({ where: { userId, status: "ACTIVE" } }),
      db.project.count({ where: { userId, status: "COMPLETED" } }),
      db.task.count({ where: { project: { userId } } }),
      db.task.count({ where: { project: { userId }, status: { not: "DONE" } } }),
      db.project.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { client: { select: { name: true } }, _count: { select: { tasks: true } } },
      }),
    ]);

  const stats = [
    { label: "Total Clients", value: clientCount, icon: Users, href: "/clients" },
    { label: "Active Projects", value: activeProjects, icon: FolderKanban, href: "/projects" },
    { label: "Completed Projects", value: completedProjects, icon: CheckCircle2, href: "/projects" },
    { label: "Total Tasks", value: totalTasks, icon: ListChecks, href: "/tasks" },
    { label: "Pending Tasks", value: pendingTasks, icon: Clock, href: "/tasks" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Overview of your freelance business.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{s.label}</p>
              <s.icon className="h-4 w-4 text-gray-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
          <Link href="/projects" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            View all →
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-sm font-medium text-gray-900">No projects yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Add a <Link href="/clients" className="underline">client</Link> and create your first{" "}
              <Link href="/projects" className="underline">project</Link> to see activity here.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Client</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 md:table-cell">Deadline</th>
                  <th className="hidden px-4 py-3 md:table-cell">Tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/projects/${p.id}`} className="font-medium text-gray-900 hover:underline">
                        {p.title}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{p.client.name}</td>
                    <td className="px-4 py-3">
                      <Badge label={PROJECT_STATUS_LABELS[p.status]} styles={PROJECT_STATUS_STYLES[p.status]} />
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{formatDate(p.deadline)}</td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{p._count.tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
