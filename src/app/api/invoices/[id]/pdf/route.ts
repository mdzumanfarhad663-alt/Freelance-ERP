import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoiceNumber, isOverdue } from "@/lib/labels";

const GRAY = rgb(0.42, 0.45, 0.5);
const DARK = rgb(0.07, 0.09, 0.15);
const LINE = rgb(0.9, 0.91, 0.92);

function money(v: unknown): string {
  return Number(v).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function dateStr(d: Date | null): string {
  return d ? d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await db.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: { client: true, project: true, user: { select: { name: true, email: true } } },
  });
  if (!invoice) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - 70;

  // Header
  page.drawText("Freelance ERP OS", { x: margin, y, size: 20, font: bold, color: DARK });
  page.drawText("INVOICE", {
    x: width - margin - bold.widthOfTextAtSize("INVOICE", 24),
    y,
    size: 24,
    font: bold,
    color: DARK,
  });
  y -= 18;
  page.drawText(`${invoice.user.name} · ${invoice.user.email}`, { x: margin, y, size: 9, font, color: GRAY });
  const num = invoiceNumber(invoice.id);
  page.drawText(num, { x: width - margin - font.widthOfTextAtSize(num, 11), y, size: 11, font, color: GRAY });

  y -= 30;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: LINE });
  y -= 30;

  // Bill To / Meta
  page.drawText("BILL TO", { x: margin, y, size: 9, font: bold, color: GRAY });
  const metaX = width / 2 + 40;
  page.drawText("ISSUE DATE", { x: metaX, y, size: 9, font: bold, color: GRAY });
  y -= 16;
  page.drawText(invoice.client.name, { x: margin, y, size: 12, font: bold, color: DARK });
  page.drawText(dateStr(invoice.createdAt), { x: metaX, y, size: 10, font, color: DARK });
  y -= 15;
  let leftY = y;
  for (const line of [invoice.client.company, invoice.client.email, invoice.client.phone].filter(
    Boolean
  ) as string[]) {
    page.drawText(line, { x: margin, y: leftY, size: 10, font, color: GRAY });
    leftY -= 14;
  }
  page.drawText("DUE DATE", { x: metaX, y, size: 9, font: bold, color: GRAY });
  y -= 15;
  page.drawText(dateStr(invoice.dueDate), { x: metaX, y, size: 10, font, color: DARK });
  y -= 24;
  page.drawText("STATUS", { x: metaX, y, size: 9, font: bold, color: GRAY });
  y -= 15;
  const overdue = isOverdue(invoice.status, invoice.dueDate);
  const statusText = invoice.status === "PAID" ? "PAID" : overdue ? "OVERDUE" : "UNPAID";
  page.drawText(statusText, {
    x: metaX,
    y,
    size: 11,
    font: bold,
    color: invoice.status === "PAID" ? rgb(0.09, 0.55, 0.29) : overdue ? rgb(0.86, 0.15, 0.15) : rgb(0.85, 0.55, 0.1),
  });

  y = Math.min(y, leftY) - 40;

  // Line item table
  page.drawRectangle({ x: margin, y: y - 6, width: width - margin * 2, height: 24, color: rgb(0.97, 0.97, 0.98) });
  page.drawText("DESCRIPTION", { x: margin + 10, y, size: 9, font: bold, color: GRAY });
  page.drawText("AMOUNT", {
    x: width - margin - 10 - bold.widthOfTextAtSize("AMOUNT", 9),
    y,
    size: 9,
    font: bold,
    color: GRAY,
  });
  y -= 30;
  const desc = invoice.project ? `${invoice.project.title}` : "Professional services";
  page.drawText(desc, { x: margin + 10, y, size: 11, font, color: DARK });
  const amt = money(invoice.amount);
  page.drawText(amt, { x: width - margin - 10 - font.widthOfTextAtSize(amt, 11), y, size: 11, font, color: DARK });
  if (invoice.project?.description) {
    y -= 14;
    page.drawText(invoice.project.description.slice(0, 90), { x: margin + 10, y, size: 9, font, color: GRAY });
  }
  y -= 20;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: LINE });
  y -= 24;

  // Total
  const totalLabel = "TOTAL DUE";
  const totalVal = money(invoice.amount);
  page.drawText(totalLabel, {
    x: width - margin - 150,
    y,
    size: 10,
    font: bold,
    color: GRAY,
  });
  page.drawText(totalVal, {
    x: width - margin - bold.widthOfTextAtSize(totalVal, 16),
    y: y - 2,
    size: 16,
    font: bold,
    color: DARK,
  });

  // Notes
  if (invoice.notes) {
    y -= 50;
    page.drawText("NOTES", { x: margin, y, size: 9, font: bold, color: GRAY });
    y -= 15;
    // naive wrap at ~95 chars
    const words = invoice.notes.split(/\s+/);
    let line = "";
    for (const w of words) {
      if ((line + " " + w).length > 95) {
        page.drawText(line, { x: margin, y, size: 9, font, color: DARK });
        y -= 13;
        line = w;
      } else {
        line = line ? `${line} ${w}` : w;
      }
    }
    if (line) page.drawText(line, { x: margin, y, size: 9, font, color: DARK });
  }

  // Footer
  page.drawText("Generated by Freelance ERP OS", { x: margin, y: 40, size: 8, font, color: GRAY });

  const bytes = await pdf.save();

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${num}.pdf"`,
    },
  });
}
