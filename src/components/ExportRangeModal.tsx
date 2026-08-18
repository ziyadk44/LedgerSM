"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Button, Field, Input } from "@/components/ui";
import { useLedger } from "@/lib/ledger-context";
import { useToast } from "@/components/Toast";
import { fmtDate, todayISO } from "@/lib/format";
import { exportPaymentsPDF } from "@/lib/pdf";

export default function ExportRangeModal({ onClose }: { onClose: () => void }) {
  const { suppliers, bills, payments, supplierName } = useLedger();
  const { showToast } = useToast();
  const today = todayISO();
  const monthStart = today.slice(0, 8) + "01";
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [supplierId, setSupplierId] = useState("all");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (!from || !to || from > to) {
      setError("Please choose a valid date range.");
      return;
    }
    let rows = payments.filter((p) => p.date >= from && p.date <= to);
    if (supplierId !== "all") {
      const billIds = new Set(bills.filter((b) => b.supplierId === supplierId).map((b) => b.id));
      rows = rows.filter((p) => billIds.has(p.billId));
    }
    if (rows.length === 0) {
      setError("No payments found in this range.");
      return;
    }
    setBusy(true);
    try {
      const enriched = rows.map((p) => {
        const bill = bills.find((b) => b.id === p.billId);
        return {
          ...p,
          supplierNameResolved: supplierName(bill?.supplierId),
          billDate: bill?.date ?? null,
        };
      });
      let subtitle = `${fmtDate(from)} – ${fmtDate(to)}`;
      if (supplierId !== "all") subtitle += ` · ${supplierName(supplierId)}`;
      await exportPaymentsPDF({ rows: enriched, subtitle, fileTag: `${from}_to_${to}` });
      showToast("PDF generated.");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Export Payments — Date Range"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={generate} disabled={busy}>
            Generate PDF
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Field label="From *">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="To *">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </div>
      <Field label="Supplier (optional)" error={error}>
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="w-full rounded border border-border bg-surface px-3 py-2.5 text-[13.5px] text-ink focus:border-brass focus:outline-none"
        >
          <option value="all">All suppliers</option>
          {[...suppliers]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </Field>
    </Modal>
  );
}
