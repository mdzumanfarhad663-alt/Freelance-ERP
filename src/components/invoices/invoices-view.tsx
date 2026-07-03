"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Receipt, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_STYLES,
  invoiceNumber,
  isOverdue,
  formatMoney,
  formatDate,
} from "@/lib/labels";
import { InvoiceForm, invoicePayload } from "@/components/invoices/invoice-form";

export type InvoiceRow = {
  id: string;
  clientId: string;
  clientName: string;
  projectId: string | null;
  projectTitle: string | null;
  amount: number;
  status: string;
  notes: string | null;
  dueDate: string | null;
  createdAt: string;
};

const FILTERS = ["ALL", "UNPAID", "PAID", "OVERDUE"] as const;

export function InvoicesView({
  invoices,
  clients,
  projects,
}: {
  invoices: InvoiceRow[];
  clients: { id: string; name: string }[];
  projects: { id: string; title: string; clientId: string }[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("ALL");
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; invoice: InvoiceRow } | null>(null);
  const [deleting, setDeleting] = useState<InvoiceRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    if (filter === "ALL") return invoices;
    if (filter === "OVERDUE") return invoices.filter((i) => isOverdue(i.status, i.dueDate));
    return invoices.filter((i) => i.status === filter);
  }, [invoices, filter]);

  const totals = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
    const unpaid = invoices.filter((i) => i.status === "UNPAID").reduce((s, i) => s + i.amount, 0);
    return { paid, unpaid };
  }, [invoices]);

  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    const isEdit = modal?.mode === "edit";
    const res = await fetch(isEdit ? `/api/invoices/${modal.invoice.id}` : "/api/invoices", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoicePayload(form)),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Something went wrong");
      return;
    }
    setModal(null);
    router.refresh();
  }

  async function togglePaid(inv: InvoiceRow) {
    await fetch(`/api/invoices/${inv.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: inv.status !== "PAID" }),
    });
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    await fetch(`/api/invoices/${deleting.id}`, { method: "DELETE" });
    setBusy(false);
    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            {formatMoney(totals.paid)} collected · {formatMoney(totals.unpaid)} outstanding
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError("");
            setModal({ mode: "create" });
          }}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" /> New Invoice
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === s
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            }`}
          >
            {s === "ALL" ? "All" : s === "OVERDUE" ? "Overdue" : INVOICE_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <Receipt className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            {invoices.length === 0 ? "No invoices yet" : "No invoices match this filter"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {invoices.length === 0 ? "Create your first invoice to start tracking payments." : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="hidden px-4 py-3 sm:table-cell">Client</th>
                <th className="hidden px-4 py-3 md:table-cell">Project</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Due</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((i) => {
                const overdue = isOverdue(i.status, i.dueDate);
                return (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/invoices/${i.id}`} className="font-medium text-gray-900 hover:underline">
                        {invoiceNumber(i.id)}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{i.clientName}</td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{i.projectTitle ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatMoney(i.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          label={overdue ? "Overdue" : INVOICE_STATUS_LABELS[i.status]}
                          styles={overdue ? INVOICE_STATUS_STYLES.OVERDUE : INVOICE_STATUS_STYLES[i.status]}
                        />
                        {overdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{formatDate(i.dueDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => togglePaid(i)}
                          className={`rounded-md p-1.5 ${
                            i.status === "PAID"
                              ? "text-green-600 hover:bg-green-50"
                              : "text-gray-400 hover:bg-green-50 hover:text-green-600"
                          }`}
                          aria-label={i.status === "PAID" ? "Mark as unpaid" : "Mark as paid"}
                          title={i.status === "PAID" ? "Mark as unpaid" : "Mark as paid"}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <a
                          href={`/api/invoices/${i.id}/pdf`}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          aria-label="Download PDF"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setModal({ mode: "edit", invoice: i });
                          }}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          aria-label="Edit invoice"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(i)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === "create" ? "New Invoice" : "Edit Invoice"} onClose={() => setModal(null)}>
          {clients.length === 0 ? (
            <p className="text-sm text-gray-600">
              You need at least one client before creating an invoice. Add one on the Clients page first.
            </p>
          ) : (
            <InvoiceForm
              clients={clients}
              projects={projects}
              initial={modal.mode === "edit" ? modal.invoice : undefined}
              busy={busy}
              error={error}
              submitLabel={modal.mode === "create" ? "Create Invoice" : "Save Changes"}
              onSubmit={submit}
              onCancel={() => setModal(null)}
            />
          )}
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete invoice"
          message={`Delete ${invoiceNumber(deleting.id)} (${formatMoney(deleting.amount)}) for ${deleting.clientName}?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}
