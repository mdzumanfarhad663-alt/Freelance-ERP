"use client";

import { useState } from "react";
import { INVOICE_STATUSES } from "@/lib/validations";
import { INVOICE_STATUS_LABELS } from "@/lib/labels";

export type InvoiceFormValues = {
  clientId: string;
  projectId: string | null;
  amount: number;
  status: string;
  notes: string | null;
  dueDate: string | null; // ISO
};

export function InvoiceForm({
  clients,
  projects,
  initial,
  busy,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  clients: { id: string; name: string }[];
  projects: { id: string; title: string; clientId: string }[];
  initial?: Partial<InvoiceFormValues>;
  busy: boolean;
  error: string;
  submitLabel: string;
  onSubmit: (form: FormData) => void;
  onCancel: () => void;
}) {
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const clientProjects = projects.filter((p) => p.clientId === clientId);

  return (
    <form action={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="inv-client" className="block text-sm font-medium text-gray-700">
          Client *
        </label>
        <select
          id="inv-client"
          name="clientId"
          required
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        >
          <option value="" disabled>
            Select a client...
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="inv-project" className="block text-sm font-medium text-gray-700">
          Project (optional)
        </label>
        <select
          id="inv-project"
          name="projectId"
          defaultValue={initial?.projectId ?? ""}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        >
          <option value="">No project</option>
          {clientProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="inv-amount" className="block text-sm font-medium text-gray-700">
            Amount ($) *
          </label>
          <input
            id="inv-amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={initial?.amount ?? ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <div>
          <label htmlFor="inv-status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="inv-status"
            name="status"
            defaultValue={initial?.status ?? "UNPAID"}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          >
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {INVOICE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="inv-due" className="block text-sm font-medium text-gray-700">
          Due Date
        </label>
        <input
          id="inv-due"
          name="dueDate"
          type="date"
          defaultValue={initial?.dueDate ? initial.dueDate.slice(0, 10) : ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>

      <div>
        <label htmlFor="inv-notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="inv-notes"
          name="notes"
          rows={2}
          defaultValue={initial?.notes ?? ""}
          placeholder="Payment terms, bank details, thank-you note..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {busy ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function invoicePayload(form: FormData) {
  return {
    clientId: form.get("clientId"),
    projectId: form.get("projectId"),
    amount: form.get("amount"),
    status: form.get("status"),
    notes: form.get("notes"),
    dueDate: form.get("dueDate"),
  };
}
