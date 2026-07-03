"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Receipt } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { InvoiceForm, invoicePayload } from "@/components/invoices/invoice-form";

// Automation rule: completed project without an invoice → suggest creating one.
export function InvoiceSuggestion({
  project,
  clientName,
}: {
  project: { id: string; title: string; clientId: string; budget: number | null };
  clientName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoicePayload(form)),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Something went wrong");
      return;
    }
    const invoice = await res.json();
    setOpen(false);
    router.push(`/invoices/${invoice.id}`);
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <p className="inline-flex items-center gap-2 text-sm text-green-800">
          <Sparkles className="h-4 w-4" />
          This project is completed but has no invoice yet.
        </p>
        <button
          type="button"
          onClick={() => {
            setError("");
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
        >
          <Receipt className="h-4 w-4" /> Create invoice for this project
        </button>
      </div>

      {open && (
        <Modal title={`Invoice for "${project.title}"`} onClose={() => setOpen(false)}>
          <InvoiceForm
            clients={[{ id: project.clientId, name: clientName }]}
            projects={[{ id: project.id, title: project.title, clientId: project.clientId }]}
            initial={{
              clientId: project.clientId,
              projectId: project.id,
              amount: project.budget ?? undefined,
            }}
            busy={busy}
            error={error}
            submitLabel="Create Invoice"
            onSubmit={submit}
            onCancel={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
