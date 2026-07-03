"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Link2, Upload, Trash2, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export type AttachmentRow = {
  id: string;
  name: string;
  mimeType: string;
  url: string | null;
  size: number;
};

export function AttachmentsPanel({
  attachments,
  projectId,
  invoiceId,
}: {
  attachments: AttachmentRow[];
  projectId?: string;
  invoiceId?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkModal, setLinkModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const parent = projectId ? { projectId } : { invoiceId };

  async function uploadFile(file: File) {
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    if (projectId) form.append("projectId", projectId);
    if (invoiceId) form.append("invoiceId", invoiceId);
    const res = await fetch("/api/attachments", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Upload failed");
      return;
    }
    router.refresh();
  }

  async function addLink(form: FormData) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), url: form.get("url"), ...parent }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Something went wrong");
      return;
    }
    setLinkModal(false);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          <Paperclip className="h-4 w-4" /> Attachments
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setError("");
              setLinkModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Link2 className="h-3.5 w-3.5" /> Add Link
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <Upload className="h-3.5 w-3.5" /> {busy ? "Uploading..." : "Upload"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {attachments.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          No attachments. Upload a PDF/image (max 2MB) or link a Google Drive file.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {attachments.map((a) => {
            const isLink = !!a.url;
            const Icon = isLink ? ExternalLink : a.mimeType.startsWith("image/") ? ImageIcon : FileText;
            return (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <a
                  href={isLink ? a.url! : `/api/attachments/${a.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline"
                >
                  <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate">{a.name}</span>
                  {!isLink && a.size > 0 && (
                    <span className="shrink-0 text-xs text-gray-400">{(a.size / 1024).toFixed(0)} KB</span>
                  )}
                </a>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Delete ${a.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {linkModal && (
        <Modal title="Add Link" onClose={() => setLinkModal(false)}>
          <form action={addLink} className="space-y-4">
            <div>
              <label htmlFor="att-name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                id="att-name"
                name="name"
                required
                placeholder="Contract draft"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <div>
              <label htmlFor="att-url" className="block text-sm font-medium text-gray-700">
                URL *
              </label>
              <input
                id="att-url"
                name="url"
                type="url"
                required
                placeholder="https://drive.google.com/..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setLinkModal(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {busy ? "Saving..." : "Add Link"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
