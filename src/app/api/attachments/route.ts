import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { attachmentLinkSchema } from "@/lib/validations";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB — stored inline in Postgres
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp"];

async function verifyParent(userId: string, projectId?: string | null, invoiceId?: string | null) {
  if (!projectId && !invoiceId) return "Attach to a project or an invoice";
  if (projectId) {
    const p = await db.project.findFirst({ where: { id: projectId, userId } });
    if (!p) return "Project not found";
  }
  if (invoiceId) {
    const i = await db.invoice.findFirst({ where: { id: invoiceId, userId } });
    if (!i) return "Invoice not found";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const contentType = req.headers.get("content-type") ?? "";

  // JSON body → external link attachment (Google Drive etc.)
  if (contentType.includes("application/json")) {
    const parsed = attachmentLinkSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const err = await verifyParent(userId, parsed.data.projectId, parsed.data.invoiceId);
    if (err) return NextResponse.json({ message: err }, { status: 400 });

    const attachment = await db.attachment.create({
      data: {
        userId,
        name: parsed.data.name,
        url: parsed.data.url,
        mimeType: "text/uri-list",
        projectId: parsed.data.projectId || null,
        invoiceId: parsed.data.invoiceId || null,
      },
    });
    return NextResponse.json(attachment, { status: 201 });
  }

  // multipart → real file upload
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) {
    return NextResponse.json({ message: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ message: "Only PDF and image files are supported" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ message: "File too large (max 2MB) — use a Drive link instead" }, { status: 400 });
  }

  const projectId = (form.get("projectId") as string) || null;
  const invoiceId = (form.get("invoiceId") as string) || null;
  const err = await verifyParent(userId, projectId, invoiceId);
  if (err) return NextResponse.json({ message: err }, { status: 400 });

  const attachment = await db.attachment.create({
    data: {
      userId,
      name: file.name.slice(0, 200),
      mimeType: file.type,
      size: file.size,
      data: Buffer.from(await file.arrayBuffer()),
      projectId,
      invoiceId,
    },
  });

  const { data: _, ...rest } = attachment;
  return NextResponse.json(rest, { status: 201 });
}
