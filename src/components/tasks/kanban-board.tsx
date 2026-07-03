"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_PRIORITY_STYLES } from "@/lib/labels";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/validations";

export type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
};

const COLUMN_STYLES: Record<string, string> = {
  TODO: "border-t-amber-400",
  IN_PROGRESS: "border-t-blue-400",
  DONE: "border-t-green-400",
};

export function KanbanBoard({ projectId, tasks }: { projectId: string; tasks: TaskRow[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<
    { mode: "create"; status: string } | { mode: "edit"; task: TaskRow } | null
  >(null);
  const [deleting, setDeleting] = useState<TaskRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  // Optimistic status overrides so drops feel instant while the server catches up
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const effectiveTasks = tasks.map((t) => (overrides[t.id] ? { ...t, status: overrides[t.id] } : t));

  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    const isEdit = modal?.mode === "edit";
    const payload = {
      title: form.get("title"),
      status: form.get("status"),
      priority: form.get("priority"),
      ...(isEdit ? {} : { projectId }),
    };
    const res = await fetch(isEdit ? `/api/tasks/${modal.task.id}` : "/api/tasks", {
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
    await fetch(`/api/tasks/${deleting.id}`, { method: "DELETE" });
    setBusy(false);
    setDeleting(null);
    router.refresh();
  }

  async function moveTask(taskId: string, status: string) {
    const task = effectiveTasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    setOverrides((o) => ({ ...o, [taskId]: status }));
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setOverrides((o) => {
        const { [taskId]: _, ...rest } = o;
        return rest;
      });
    }
    router.refresh();
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TASK_STATUSES.map((status) => {
          const columnTasks = effectiveTasks.filter((t) => t.status === status);
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(status);
              }}
              onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                if (dragId) moveTask(dragId, status);
                setDragId(null);
              }}
              className={`flex min-h-[16rem] flex-col rounded-lg border border-gray-200 border-t-4 bg-gray-50 ${
                COLUMN_STYLES[status]
              } ${dragOver === status ? "ring-2 ring-gray-400 ring-offset-1" : ""}`}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {TASK_STATUS_LABELS[status]}
                  <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {columnTasks.length}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setModal({ mode: "create", status });
                  }}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                  aria-label={`Add task to ${TASK_STATUS_LABELS[status]}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-2 px-3 pb-3">
                {columnTasks.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-gray-400">Drop tasks here</p>
                )}
                {columnTasks.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => setDragId(null)}
                    className={`group cursor-grab rounded-md border border-gray-200 bg-white p-3 shadow-sm active:cursor-grabbing ${
                      dragId === t.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{t.title}</p>
                        <div className="mt-2">
                          <Badge
                            label={TASK_PRIORITY_LABELS[t.priority]}
                            styles={TASK_PRIORITY_STYLES[t.priority]}
                          />
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setModal({ mode: "edit", task: t });
                          }}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          aria-label={`Edit ${t.title}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(t)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${t.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal.mode === "create" ? "Add Task" : "Edit Task"} onClose={() => setModal(null)}>
          <form action={submit} className="space-y-4">
            <div>
              <label htmlFor="task-title" className="block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                id="task-title"
                name="title"
                required
                defaultValue={modal.mode === "edit" ? modal.task.title : ""}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="task-status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="task-status"
                  name="status"
                  defaultValue={modal.mode === "edit" ? modal.task.status : modal.status}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  id="task-priority"
                  name="priority"
                  defaultValue={modal.mode === "edit" ? modal.task.priority : "MEDIUM"}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {TASK_PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
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
                {busy ? "Saving..." : modal.mode === "create" ? "Add Task" : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete task"
          message={`Delete "${deleting.title}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}
