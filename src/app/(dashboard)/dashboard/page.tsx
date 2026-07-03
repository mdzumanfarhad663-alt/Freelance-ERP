import Link from "next/link";
import {
  Users,
  FolderKanban,
  ListChecks,
  DollarSign,
  Clock,
  AlertTriangle,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES, invoiceNumber, formatMoney, formatDate } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    clientCount,
    activeProjects,
    pendingTasks,
    paidAgg,
    unpaidAgg,
    monthAgg,
    pendingInvoiceCount,
    overdueInvoices,
    projectsNoInvoice,
    recentProjects,
  ] = await Promise.all([
    db.client.count({ where: { userId } }),
    db.project.count({ where: { userId, status: "ACTIVE" } }),
    db.task.count({ where: { project: { userId } }, }),
    db.invoice.aggregate({ where: { userId, status: "PAID" }, _sum: { amount: true } }),
    db.invoice.aggregate({ where: { userId, status: "UNPAID" }, _sum: { amount: true } }),
    db.invoice.aggregate({
      where: { userId, status: "PAID", paidAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    db.invoice.count({ where: { userId, status: "UNPAID" } }),
    db.invoice.findMany({
      where: { userId, status: "UNPAID", dueDate: { lt: today } },
      orderBy: { dueDate: "asc" },
      include: { client: { select: { name: true } } },
    }),
    db.project.findMany({
      where: { userId, status: "COMPLETED", invoices: { none: {} } },
      orderBy: { updatedAt: "desc" },
      include: { client: { select: { name: true } } },
    }),
    db.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { client: { select: { name: true } }, _count: { select: { tasks: true } } },
    }),
  ]);

  const totalRevenue = Number(paidAgg._sum.amount ?? 0);
  const pendingRevenue = Number(unpaidAgg._sum.amount ?? 0);
  const monthRevenue = Number(monthAgg._sum.amount ?? 0);

  const stats = [
    { label: "Total Revenue", value: formatMoney(totalRevenue), icon: DollarSign, href: "/invoices" },
    { label: "This Month", value: formatMoney(monthRevenue), icon: TrendingUp, href: "/invoices" },
    { label: "Pending Revenue", value: formatMoney(pendingRevenue), icon: Clock, href: "/invoices" },
    { label: "Clients", value: String(clientCount), icon: Users, href: "/clients" },
    { label: "Active Projects", value: String(activeProjects), icon: FolderKanban, href: "/projects" },
    { label: "Total Tasks", value: String(pendingTasks), icon: ListChecks, href: "/tasks" },
  ];

  const hasAlerts = overdueInvoices.length > 0 || projectsNoInvoice.length > 0 || pendingInvoiceCount > 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Overview of your freelance business.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
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
            <p className="mt-2 truncate text-xl font-semibold text-gray-900 sm:text-2xl">{s.value}</p>
          </Link>
        ))}
      </div>

      {hasAlerts && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Needs Attention</h2>
          <div className="mt-4 space-y-3">
            {overdueInvoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 hover:bg-red-100"
              >
                <p className="inline-flex items-center gap-2 text-sm text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">Overdue Invoice</span> — {invoiceNumber(inv.id)} ·{" "}
                  {inv.client.name} · {formatMoney(inv.amount)}
                </p>
                <span className="text-xs font-medium text-red-600">Due {formatDate(inv.dueDate)}</span>
              </Link>
            ))}

            {projectsNoInvoice.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 hover:bg-green-100"
              >
                <p className="inline-flex items-center gap-2 text-sm text-green-800">
                  <Receipt className="h-4 w-4" />
                  <span className="font-semibold">Ready to invoice</span> — &quot;{p.title}&quot; for{" "}
                  {p.client.name} is completed with no invoice
                </p>
                <span className="text-xs font-medium text-green-700">Create invoice →</span>
              </Link>
            ))}

            {pendingInvoiceCount > 0 && (
              <Link
                href="/invoices"
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100"
              >
                <p className="inline-flex items-center gap-2 text-sm text-amber-800">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">
                    {pendingInvoiceCount} unpaid invoice{pendingInvoiceCount === 1 ? "" : "s"}
                  </span>
                  — {formatMoney(pendingRevenue)} outstanding
                </p>
                <span className="text-xs font-medium text-amber-700">View invoices →</span>
              </Link>
            )}
          </div>
        </div>
      )}

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
