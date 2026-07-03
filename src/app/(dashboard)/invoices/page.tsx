import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { InvoicesView } from "@/components/invoices/invoices-view";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [invoices, clients, projects] = await Promise.all([
    db.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
      },
    }),
    db.client.findMany({ where: { userId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.project.findMany({
      where: { userId },
      orderBy: { title: "asc" },
      select: { id: true, title: true, clientId: true },
    }),
  ]);

  return (
    <InvoicesView
      clients={clients}
      projects={projects}
      invoices={invoices.map((i) => ({
        id: i.id,
        clientId: i.clientId,
        clientName: i.client.name,
        projectId: i.projectId,
        projectTitle: i.project?.title ?? null,
        amount: Number(i.amount),
        status: i.status,
        notes: i.notes,
        dueDate: i.dueDate ? i.dueDate.toISOString() : null,
        createdAt: i.createdAt.toISOString(),
      }))}
    />
  );
}
