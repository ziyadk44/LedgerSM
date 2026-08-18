"use client";

import type { Payment } from "@/lib/types";
import { fmtDate, fmtMoney, todayISO } from "@/lib/format";

type Row = Payment & { supplierNameResolved: string; billDate: string | null; billAmount: number };

export async function exportPaymentsPDF(opts: {
  rows: Row[];
  subtitle: string;
  fileTag: string;
}) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const rows = [...opts.rows].sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length === 0) {
    throw new Error("No payments to export.");
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(33, 31, 28);
  doc.text("Shariq Marbles", 40, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(110, 106, 98);
  doc.text("Supplier Payment Statement", 40, 62);

  doc.setFontSize(9.5);
  doc.text(opts.subtitle, pageWidth - 40, 46, { align: "right" });
  doc.text("Generated on " + fmtDate(todayISO()), pageWidth - 40, 60, { align: "right" });

  doc.setDrawColor(147, 113, 47);
  doc.setLineWidth(1);
  doc.line(40, 72, pageWidth - 40, 72);

  // --- Bill summary (dedupe by billId so multi-bill exports aren't double-counted) ---
  const billMap = new Map<string, number>();
  rows.forEach((r) => {
    if (r.billId && !billMap.has(r.billId)) {
      billMap.set(r.billId, r.billAmount);
    }
  });
  const totalBilled = [...billMap.values()].reduce((s, v) => s + v, 0);
  const totalPaid = rows.reduce((s, r) => s + Number(r.amount), 0);
  const due = totalBilled - totalPaid;
  const isSettled = due <= 0.01;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 106, 98);
  doc.text(`Total Bill Amount: ${fmtMoney(totalBilled)}`, 40, 86);
  doc.text(`Total Paid: ${fmtMoney(totalPaid)}`, 40, 100);

  doc.setFont("helvetica", "bold");
  if (isSettled) {
    doc.setTextColor(46, 125, 50);
    doc.text("Status: Settled", 40, 114);
  } else {
    doc.setTextColor(198, 40, 40);
    doc.text(`Outstanding Due: ${fmtMoney(due)}`, 40, 114);
  }
  doc.setTextColor(33, 31, 28);

  const body = rows.map((r) => [
    fmtDate(r.date),
    r.supplierNameResolved,
    fmtDate(r.billDate),
    r.mode === "cash" ? "Cash" : "Online/Cheque",
    r.note || "-",
    fmtMoney(r.amount),
  ]);
  const total = rows.reduce((s, r) => s + Number(r.amount), 0);

  autoTable(doc, {
    startY: 128,
    head: [["Date", "Supplier", "Bill Date", "Mode", "Reference", "Amount"]],
    body,
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6, textColor: [33, 31, 28] },
    headStyles: { fillColor: [33, 31, 28], textColor: [244, 241, 234], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [247, 245, 241] },
    columnStyles: { 5: { halign: "right", fontStyle: "bold" } },
    margin: { left: 40, right: 40 },
    foot: [["", "", "", "", "Total Paid", fmtMoney(total)]],
    footStyles: { fillColor: [241, 231, 210], textColor: [90, 70, 27], fontStyle: "bold", halign: "right" },
  });

  // @ts-expect-error - lastAutoTable is added by the plugin at runtime
  const finalY = (doc.lastAutoTable?.finalY ?? 128) + 40;
  doc.setFontSize(8.5);
  doc.setTextColor(150, 146, 140);
  doc.text(
    "Shariq Marbles — Marble & Granite · Generated from the supplier payment ledger",
    40,
    Math.min(finalY, doc.internal.pageSize.getHeight() - 30)
  );

  doc.save(`Shariq-Marbles-Payments-${opts.fileTag}.pdf`);
}
// type Row = Payment & { supplierNameResolved: string; billDate: string | null };

// export async function exportPaymentsPDF(opts: {
//   rows: Row[];
//   subtitle: string;
//   fileTag: string;
// }) {
//   const { jsPDF } = await import("jspdf");
//   const autoTable = (await import("jspdf-autotable")).default;

//   const rows = [...opts.rows].sort((a, b) => a.date.localeCompare(b.date));
//   if (rows.length === 0) {
//     throw new Error("No payments to export.");
//   }

//   const doc = new jsPDF({ unit: "pt", format: "a4" });
//   const pageWidth = doc.internal.pageSize.getWidth();

//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(17);
//   doc.setTextColor(33, 31, 28);
//   doc.text("Shariq Marbles", 40, 46);
//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(10.5);
//   doc.setTextColor(110, 106, 98);
//   doc.text("Supplier Payment Statement", 40, 62);

//   doc.setFontSize(9.5);
//   doc.text(opts.subtitle, pageWidth - 40, 46, { align: "right" });
//   doc.text("Generated on " + fmtDate(todayISO()), pageWidth - 40, 60, { align: "right" });

//   doc.setDrawColor(147, 113, 47);
//   doc.setLineWidth(1);
//   doc.line(40, 72, pageWidth - 40, 72);

//   const body = rows.map((r) => [
//     fmtDate(r.date),
//     r.supplierNameResolved,
//     fmtDate(r.billDate),
//     r.mode === "cash" ? "Cash" : "Online/Cheque",
//     r.note || "-",
//     fmtMoney(r.amount),
//   ]);
//   const total = rows.reduce((s, r) => s + Number(r.amount), 0);

//   autoTable(doc, {
//     startY: 86,
//     head: [["Date", "Supplier", "Bill Date", "Mode", "Reference", "Amount"]],
//     body,
//     styles: { font: "helvetica", fontSize: 9, cellPadding: 6, textColor: [33, 31, 28] },
//     headStyles: { fillColor: [33, 31, 28], textColor: [244, 241, 234], fontStyle: "bold" },
//     alternateRowStyles: { fillColor: [247, 245, 241] },
//     columnStyles: { 5: { halign: "right", fontStyle: "bold" } },
//     margin: { left: 40, right: 40 },
//     foot: [["", "", "", "", "Total", fmtMoney(total)]],
//     footStyles: { fillColor: [241, 231, 210], textColor: [90, 70, 27], fontStyle: "bold", halign: "right" },
//   });

//   // @ts-expect-error - lastAutoTable is added by the plugin at runtime
//   const finalY = (doc.lastAutoTable?.finalY ?? 86) + 40;
//   doc.setFontSize(8.5);
//   doc.setTextColor(150, 146, 140);
//   doc.text(
//     "Shariq Marbles — Marble & Granite · Generated from the supplier payment ledger",
//     40,
//     Math.min(finalY, doc.internal.pageSize.getHeight() - 30)
//   );

//   doc.save(`Shariq-Marbles-Payments-${opts.fileTag}.pdf`);
// }
