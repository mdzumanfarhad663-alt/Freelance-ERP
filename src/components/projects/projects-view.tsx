"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FolderKanban, CalendarDays, ListChecks } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES, formatMoney, formatDate } from "@/lib/labels";
import { PROJECT_STATUSES } from "@/lib/validations";
import { ProjectForm, projectPayload, type ProjectFormValues } from "@/components/projects/project-form";

export type ProjectRow = ProjectFormValues & {
  id: string;
  clientName: string;
  taskCount: number;
};

export function ProjectsView({
  projects,
  clients,
}: {
  projects: ProjectRow[];
  clients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("ALL");
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; project: ProjectRow } | null>(null);
  const [deleting, setDeleting] = useState<ProjectRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(
    () => (filter === "ALL" ? projects : projects.filter((p) => p.status === filter)),
    [projects, filter]
  );

  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    const isEdit = modal?.mode === "edit";
    const res = await fetch(isEdit ? `/api/projects/${modal.project.id}` : "/api/projects", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectPayload(form)),
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
    await fetch(`/api/projects/${deleting.id}`, { method: "DELETE" });
    setBusy(false);
    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            {projects.length} project{projects.length === 1 ? "" : "s"} across your clients.
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
          <Plus className="h-4 w-4" /> Add Project
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {["ALL", ...PROJECT_STATUSES].map((s) => (
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
            {s === "ALL" ? "All" : PROJECT_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <FolderKanban className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            {projects.length === 0 ? "No projects yet" : "No projects with this status"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {projects.length === 0
              ? clients.length === 0
                ? "Add a client first, then create a project for them."
                : "Create your first project to get started."
              : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/projects/${p.id}`}
                  className="text-base font-semibold text-gray-900 hover:underline"
                >
                  {p.title}
                </Link>
                <Badge label={PROJECT_STATUS_LABELS[p.status]} styles={PROJECT_STATUS_STYLES[p.status]} />
              </div>
              <p className="mt-1 text-sm text-gray-500">{p.clientName}</p>
              {p.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{p.description}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="font-medium text-gray-900">{p.budget !== null ? formatMoney(p.budget) : "—"}</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> {formatDate(p.deadline)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ListChecks className="h-3.5 w-3.5" /> {p.taskCount} task{p.taskCount === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <Link href={`/projects/${p.id}`} className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Open board →
                </Link>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setModal({ mode: "edit", project: p });
                    }}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    aria-label={`Edit ${p.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(p)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${p.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === "create" ? "Add Project" : "Edit Project"} onClose={() => setModal(null)}>
          {clients.length === 0 ? (
            <p className="text-sm text-gray-600">
              You need at least one client before creating a project. Add one on the Clients page first.
            </p>
          ) : (
            <ProjectForm
              clients={clients}
              initial={modal.mode === "edit" ? modal.project : undefined}
              busy={busy}
              error={error}
              submitLabel={modal.mode === "create" ? "Add Project" : "Save Changes"}
              onSubmit={submit}
              onCancel={() => setModal(null)}
            />
          )}
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete project"
          message={`Delete "${deleting.title}"? Its ${deleting.taskCount} task(s) will be deleted too.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}
