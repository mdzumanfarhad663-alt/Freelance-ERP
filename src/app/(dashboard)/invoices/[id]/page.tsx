import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { AttachmentsPanel } from "@/components/attachments/attachments-panel";
import { MarkPaidButton } from "@/components/invoices/mark-paid-button";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_STYLES,
  invoiceNumber,
  isOverdue,
  formatMoney,
  formatDate,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const invoice = await db.invoice.findFirst({
    where: { id, userId: session!.user.id },
    include: {
      client: true,
      project: { select: { id: true, title: true, description: true } },
      attachments: { orderBy: { createdAt: "desc" } },
      user: { select: { name: true, email: true } },
    },
  });
  if (!invoice) notFound();

  const overdue = isOverdue(invoice.status, invoice.dueDate);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to invoices
        </Link>
        <div className="flex gap-2">
          <MarkPaidButton invoiceId={invoice.id} paid={invoice.status === "PAID"} />
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Download className="h-4 w-4" /> Download PDF
          </a>
        </div>
      </div>

      {/* Print-ready invoice document */}
      <div className="mx-auto mt-6 max-w-3xl rounded-lg border border-gray-200 bg-white p-8 sm:p-10 print:border-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Freelance ERP OS</h1>
            <p className="mt-1 text-sm text-gray-500">
              {invoice.user.name} · {invoice.user.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight text-gray-900">INVOICE</p>
            <p className="mt-1 text-sm text-gray-500">{invoiceNumber(invoice.id)}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 border-t border-gray-200 pt-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bill To</p>
            <p className="mt-2 text-base font-semibold text-gray-900">{invoice.client.name}</p>
            {invoice.client.company && <p className="text-sm text-gray-600">{invoice.client.company}</p>}
            {invoice.client.email && <p className="text-sm text-gray-600">{invoice.client.email}</p>}
            {invoice.client.phone && <p className="text-sm text-gray-600">{invoice.client.phone}</p>}
          </div>
          <div className="space-y-3 sm:text-right">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Issue Date</p>
              <p className="mt-0.5 text-sm text-gray-900">{formatDate(invoice.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Due Date</p>
              <p className="mt-0.5 text-sm text-gray-900">{formatDate(invoice.dueDate)}</p>
            </div>
            <div className="sm:flex sm:justify-end">
              <Badge
                label={overdue ? "Overdue" : INVOICE_STATUS_LABELS[invoice.status]}
                styles={overdue ? INVOICE_STATUS_STYLES.OVERDUE : INVOICE_STATUS_STYLES[invoice.status]}
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="overflow-hidden rounded-md border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900">
                      {invoice.project ? invoice.project.title : "Professional services"}
                    </p>
                    {invoice.project?.description && (
                      <p className="mt-1 text-gray-500">{invoice.project.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-gray-900">
                    {formatMoney(invoice.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between border-t border-gray-900 pt-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Total Due</p>
                <p className="text-xl font-bold text-gray-900">{formatMoney(invoice.amount)}</p>
              </div>
              {invoice.status === "PAID" && invoice.paidAt && (
                <p className="text-right text-xs text-green-600">Paid on {formatDate(invoice.paidAt)}</p>
              )}
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
            <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}
      </div>

      <div className="mx-auto mt-6 max-w-3xl print:hidden">
        <AttachmentsPanel
          invoiceId={invoice.id}
          attachments={invoice.attachments.map((a) => ({
            id: a.id,
            name: a.name,
            mimeType: a.mimeType,
            url: a.url,
            size: a.size,
          }))}
        />
      </div>
    </div>
  );
}
