"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Undo2 } from "lucide-react";

export function MarkPaidButton({ invoiceId, paid }: { invoiceId: string; paid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/invoices/${invoiceId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: !paid }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${
        paid
          ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          : "bg-green-600 text-white hover:bg-green-700"
      }`}
    >
      {paid ? (
        <>
          <Undo2 className="h-4 w-4" /> {busy ? "Updating..." : "Mark as Unpaid"}
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4" /> {busy ? "Updating..." : "Mark as Paid"}
        </>
      )}
    </button>
  );
}
