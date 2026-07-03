import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Building2, CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { InvoiceSuggestion } from "@/components/invoices/invoice-suggestion";
import { AttachmentsPanel } from "@/components/attachments/attachments-panel";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES, formatMoney, formatDate } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user.id },
    include: {
      client: true,
      tasks: { orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      _count: { select: { invoices: true } },
    },
  });

  if (!project) notFound();

  const needsInvoice = project.status === "COMPLETED" && project._count.invoices === 0;

  return (
    <div>
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      {needsInvoice && (
        <InvoiceSuggestion
          project={{
            id: project.id,
            title: project.title,
            clientId: project.clientId,
            budget: project.budget !== null ? Number(project.budget) : null,
          }}
          clientName={project.client.name}
        />
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">{project.title}</h1>
            <Badge
              label={PROJECT_STATUS_LABELS[project.status]}
              styles={PROJECT_STATUS_STYLES[project.status]}
            />
          </div>
          {project.description && <p className="mt-2 text-sm text-gray-600">{project.description}</p>}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            <span>
              Budget: <span className="font-medium text-gray-900">{project.budget !== null ? formatMoney(project.budget) : "—"}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4 text-gray-400" /> Deadline:{" "}
              <span className="font-medium text-gray-900">{formatDate(project.deadline)}</span>
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Client</h2>
          <p className="mt-2 text-base font-medium text-gray-900">{project.client.name}</p>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            {project.client.company && (
              <p className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" /> {project.client.company}
              </p>
            )}
            {project.client.email && (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" /> {project.client.email}
              </p>
            )}
            {project.client.phone && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" /> {project.client.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <AttachmentsPanel
          projectId={project.id}
          attachments={project.attachments.map((a) => ({
            id: a.id,
            name: a.name,
            mimeType: a.mimeType,
            url: a.url,
            size: a.size,
          }))}
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Task Board</h2>
        <KanbanBoard
          projectId={project.id}
          tasks={project.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
          }))}
        />
      </div>
    </div>
  );
}
