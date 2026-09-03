import PDFDocument from "pdfkit";

interface QuoteItem {
  productName: string;
  size?: string | null;
  absorbency?: string | null;
  dailyPads: number;
  days: number;
  totalPads: number;
  unitPrice: number;
  lineTotal: number;
}

interface QuoteData {
  quoteNumber: string;
  createdAt: Date | string;
  validUntil?: Date | string | null;
  coordinatorName: string;
  coordinatorEmail: string;
  participantRef?: string | null;
  planManagerEmail?: string | null;
  supplyPeriod: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  delivery: number;
  gst: number;
  total: number;
}

// Branded, numbered NDIS quote PDF. Mirrors the invoice generator's style
// but adapted for a quote (validity date, participant reference, pads usage).
export const generateQuotePdf = (data: QuoteData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const teal = "#2F7D6F";
    const lightGray = "#F3F4F6";
    const darkGray = "#374151";
    const mutedGray = "#9CA3AF";
    const pageWidth = doc.page.width - 100;
    const col1X = 50;

    const fmtDate = (d: Date | string) =>
      new Date(d).toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

    // ── Header ──
    doc.rect(50, 40, pageWidth, 72).fill(teal);
    doc.fillColor("#FFFFFF").fontSize(22).font("Helvetica-Bold").text("QUOTE", 60, 58);
    doc.fontSize(10).font("Helvetica").text("Bestiee· NDIS Supplies", 60, 86);
    doc.fontSize(10)
      .text(`Quote #${data.quoteNumber}`, 400, 58, { align: "right", width: pageWidth - 350 })
      .text(`Date: ${fmtDate(data.createdAt)}`, 400, 74, { align: "right", width: pageWidth - 350 });
    if (data.validUntil) {
      doc.text(`Valid until: ${fmtDate(data.validUntil)}`, 400, 90, {
        align: "right",
        width: pageWidth - 350,
      });
    }

    // ── Prepared for / details ──
    const sectionY = 132;
    const col2X = 320;
    doc.fillColor(teal).fontSize(9).font("Helvetica-Bold").text("PREPARED FOR", col1X, sectionY);
    doc.fillColor(darkGray).fontSize(10).font("Helvetica-Bold").text(data.coordinatorName, col1X, sectionY + 14);
    doc.fontSize(9).font("Helvetica").text(data.coordinatorEmail, col1X, sectionY + 28);
    if (data.participantRef)
      doc.text(`Participant ref: ${data.participantRef}`, col1X, sectionY + 42);
    if (data.planManagerEmail)
      doc.text(`Plan manager: ${data.planManagerEmail}`, col1X, sectionY + 56, { width: 240 });

    doc.fillColor(teal).fontSize(9).font("Helvetica-Bold").text("SUPPLY DETAILS", col2X, sectionY);
    doc.fillColor(darkGray).fontSize(9).font("Helvetica")
      .text("Supply period:", col2X, sectionY + 14);
    doc.font("Helvetica-Bold").text(data.supplyPeriod, col2X + 105, sectionY + 14);

    // ── Items table ──
    const tableTop = sectionY + 96;
    const cols = {
      name: col1X,
      usage: col1X + 170,
      pads: col1X + 270,
      unit: col1X + 345,
      total: col1X + 425,
    };
    doc.rect(col1X, tableTop, pageWidth, 22).fill(teal);
    doc.fillColor("#FFFFFF").fontSize(8.5).font("Helvetica-Bold");
    doc.text("PRODUCT", cols.name + 4, tableTop + 7)
      .text("USAGE", cols.usage, tableTop + 7)
      .text("TOTAL PADS", cols.pads, tableTop + 7)
      .text("UNIT", cols.unit, tableTop + 7)
      .text("LINE TOTAL", cols.total, tableTop + 7);

    let rowY = tableTop + 22;
    data.items.forEach((item, i) => {
      const bg = i % 2 === 0 ? "#FFFFFF" : lightGray;
      doc.rect(col1X, rowY, pageWidth, 26).fill(bg);
      doc.fillColor(darkGray).fontSize(8.5).font("Helvetica");
      const sub = [item.size, item.absorbency].filter(Boolean).join(" · ");
      doc.font("Helvetica-Bold").text(item.productName, cols.name + 4, rowY + 5, { width: 160, ellipsis: true });
      if (sub) doc.font("Helvetica").fillColor(mutedGray).fontSize(7.5).text(sub, cols.name + 4, rowY + 16, { width: 160 });
      doc.fillColor(darkGray).fontSize(8.5).font("Helvetica")
        .text(`${item.dailyPads}/day × ${item.days}d`, cols.usage, rowY + 9)
        .text(String(item.totalPads), cols.pads, rowY + 9)
        .text(`$${item.unitPrice.toFixed(2)}`, cols.unit, rowY + 9)
        .text(`$${item.lineTotal.toFixed(2)}`, cols.total, rowY + 9);
      rowY += 26;
    });

    // ── Totals ──
    const totalsX = cols.unit - 40;
    const totalsWidth = pageWidth - (totalsX - col1X);
    rowY += 10;
    const addRow = (label: string, value: string, bold = false, hl = false) => {
      if (hl) doc.rect(totalsX, rowY, totalsWidth, 22).fill(teal);
      doc.fillColor(hl ? "#FFFFFF" : darkGray).fontSize(9).font(bold ? "Helvetica-Bold" : "Helvetica")
        .text(label, totalsX + 5, rowY + 7)
        .text(value, totalsX + 80, rowY + 7, { align: "right", width: totalsWidth - 90 });
      rowY += 22;
    };
    addRow("Subtotal", `$${data.subtotal.toFixed(2)}`);
    if (data.discount > 0) addRow("Annual discount", `-$${data.discount.toFixed(2)}`);
    addRow("Delivery", `$${data.delivery.toFixed(2)}`);
    addRow("GST", `$${data.gst.toFixed(2)}`);
    addRow("TOTAL", `$${data.total.toFixed(2)}`, true, true);

    // ── Footer ──
    doc.fillColor(mutedGray).fontSize(8).font("Helvetica").text(
      "This quote is an estimate of supply based on the usage provided. Continence aids and NDIS supplies may be GST-free. Questions? Contact hello@mybestiee.com.au",
      col1X,
      rowY + 24,
      { align: "center", width: pageWidth }
    );

    doc.end();
  });
};