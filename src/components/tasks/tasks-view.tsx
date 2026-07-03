"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ListChecks, ExternalLink } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_STYLES,
} from "@/lib/labels";
import { TASK_STATUSES } from "@/lib/validations";

type TaskListRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  projectTitle: string;
};

const TASK_STATUS_STYLES: Record<string, string> = {
  TODO: "bg-amber-50 text-amber-700 ring-amber-600/20",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-600/20",
  DONE: "bg-green-50 text-green-700 ring-green-600/20",
};

export function TasksView({ tasks }: { tasks: TaskListRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [deleting, setDeleting] = useState<TaskListRow | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () => (filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter]
  );

  async function updateStatus(task: TaskListRow, status: string) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
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

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Tasks</h1>
        <p className="mt-1 text-sm text-gray-500">
          All tasks across your projects. Add tasks from a project&apos;s board.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {["ALL", ...TASK_STATUSES].map((s) => (
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
            {s === "ALL" ? "All" : TASK_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <ListChecks className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            {tasks.length === 0 ? "No tasks yet" : "No tasks with this status"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {tasks.length === 0 ? "Open a project and add tasks to its board." : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="hidden px-4 py-3 sm:table-cell">Project</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Priority</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <Link
                      href={`/projects/${t.projectId}`}
                      className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 hover:underline"
                    >
                      {t.projectTitle} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={t.status}
                      onChange={(e) => updateStatus(t, e.target.value)}
                      aria-label={`Status of ${t.title}`}
                      className={`rounded-full border-0 py-0.5 pl-2 pr-7 text-xs font-medium ring-1 ring-inset focus:ring-2 ${TASK_STATUS_STYLES[t.status]}`}
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {TASK_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <Badge label={TASK_PRIORITY_LABELS[t.priority]} styles={TASK_PRIORITY_STYLES[t.priority]} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDeleting(t)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${t.title}`}
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
