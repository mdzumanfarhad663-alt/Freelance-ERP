"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/modal";

export type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  projectCount: number;
};

export function ClientsView({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; client: ClientRow } | null>(null);
  const [deleting, setDeleting] = useState<ClientRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q)
    );
  }, [clients, query]);

  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      company: form.get("company"),
      notes: form.get("notes"),
    };
    const isEdit = modal?.mode === "edit";
    const res = await fetch(isEdit ? `/api/clients/${modal.client.id}` : "/api/clients", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    await fetch(`/api/clients/${deleting.id}`, { method: "DELETE" });
    setBusy(false);
    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-500">
            {clients.length} client{clients.length === 1 ? "" : "s"} in your directory.
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
          <Plus className="h-4 w-4" /> Add Client
        </button>
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or company..."
          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            {clients.length === 0 ? "No clients yet" : "No matches"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {clients.length === 0 ? "Add your first client to get started." : "Try a different search."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 sm:table-cell">Email</th>
                <th className="hidden px-4 py-3 md:table-cell">Phone</th>
                <th className="hidden px-4 py-3 md:table-cell">Company</th>
                <th className="px-4 py-3">Projects</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{c.email ?? "—"}</td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{c.phone ?? "—"}</td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{c.company ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.projectCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setModal({ mode: "edit", client: c });
                        }}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        aria-label={`Edit ${c.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(c)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === "create" ? "Add Client" : "Edit Client"} onClose={() => setModal(null)}>
          <form action={submit} className="space-y-4">
            {(
              [
                { name: "name", label: "Name *", type: "text", required: true },
                { name: "email", label: "Email", type: "email" },
                { name: "phone", label: "Phone", type: "text" },
                { name: "company", label: "Company", type: "text" },
              ] as const
            ).map((f) => (
              <div key={f.name}>
                <label htmlFor={f.name} className="block text-sm font-medium text-gray-700">
                  {f.label}
                </label>
                <input
                  id={f.name}
                  name={f.name}
                  type={f.type}
                  required={"required" in f && f.required}
                  defaultValue={modal.mode === "edit" ? modal.client[f.name] ?? "" : ""}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>
            ))}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={modal.mode === "edit" ? modal.client.notes ?? "" : ""}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {busy ? "Saving..." : modal.mode === "create" ? "Add Client" : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete client"
          message={`Delete "${deleting.name}"? This also deletes their ${deleting.projectCount} project(s) and all related tasks and invoices.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}
