export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Pending",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
};

export const PROJECT_STATUS_STYLES: Record<string, string> = {
  PLANNED: "bg-amber-50 text-amber-700 ring-amber-600/20",
  ACTIVE: "bg-blue-50 text-blue-700 ring-blue-600/20",
  ON_HOLD: "bg-gray-100 text-gray-600 ring-gray-500/20",
  COMPLETED: "bg-green-50 text-green-700 ring-green-600/20",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: "Todo",
  IN_PROGRESS: "Doing",
  DONE: "Done",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const TASK_PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600 ring-gray-500/20",
  MEDIUM: "bg-amber-50 text-amber-700 ring-amber-600/20",
  HIGH: "bg-red-50 text-red-700 ring-red-600/20",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  PAID: "Paid",
};

export const INVOICE_STATUS_STYLES: Record<string, string> = {
  UNPAID: "bg-amber-50 text-amber-700 ring-amber-600/20",
  PAID: "bg-green-50 text-green-700 ring-green-600/20",
  OVERDUE: "bg-red-50 text-red-700 ring-red-600/20",
};

export function invoiceNumber(id: string): string {
  return `INV-${id.slice(-6).toUpperCase()}`;
}

export function isOverdue(status: string, dueDate: string | Date | null | undefined): boolean {
  if (status === "PAID" || !dueDate) return false;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

export function formatMoney(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
