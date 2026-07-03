import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// Download / open an uploaded file (external links open directly via their URL)
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const attachment = await db.attachment.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!attachment) return NextResponse.json({ message: "Attachment not found" }, { status: 404 });

  if (attachment.url) return NextResponse.redirect(attachment.url);
  if (!attachment.data) return NextResponse.json({ message: "No file data" }, { status: 404 });

  return new NextResponse(Buffer.from(attachment.data), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${attachment.name.replace(/"/g, "")}"`,
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { count } = await db.attachment.deleteMany({ where: { id, userId: session.user.id } });
  if (count === 0) return NextResponse.json({ message: "Attachment not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
