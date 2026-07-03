"use client";

import { PROJECT_STATUSES } from "@/lib/validations";
import { PROJECT_STATUS_LABELS } from "@/lib/labels";

export type ProjectFormValues = {
  title: string;
  description: string | null;
  clientId: string;
  status: string;
  budget: number | null;
  deadline: string | null; // ISO
};

export function ProjectForm({
  clients,
  initial,
  busy,
  error,
  submitLabel,
  onSubmit,
  onCancel,
  defaultClientId,
}: {
  clients: { id: string; name: string }[];
  initial?: ProjectFormValues;
  busy: boolean;
  error: string;
  submitLabel: string;
  onSubmit: (form: FormData) => void;
  onCancel: () => void;
  defaultClientId?: string;
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>

      <div>
        <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
          Client *
        </label>
        <select
          id="clientId"
          name="clientId"
          required
          defaultValue={initial?.clientId ?? defaultClientId ?? ""}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initial?.status ?? "PLANNED"}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
            Budget ($)
          </label>
          <input
            id="budget"
            name="budget"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initial?.budget ?? ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
          Deadline
        </label>
        <input
          id="deadline"
          name="deadline"
          type="date"
          defaultValue={initial?.deadline ? initial.deadline.slice(0, 10) : ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
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

export function projectPayload(form: FormData) {
  return {
    title: form.get("title"),
    description: form.get("description"),
    clientId: form.get("clientId"),
    status: form.get("status"),
    budget: form.get("budget"),
    deadline: form.get("deadline"),
  };
}
