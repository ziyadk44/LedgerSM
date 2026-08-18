"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Button, Field, Input } from "@/components/ui";
import { useLedger } from "@/lib/ledger-context";
import { useToast } from "@/components/Toast";
import { todayISO } from "@/lib/format";
import type { Bill } from "@/lib/types";

export default function BillModal({
  supplierId,
  supplierName,
  bill,
  onClose,
}: {
  supplierId: string;
  supplierName: string;
  bill?: Bill | null;
  onClose: () => void;
}) {
  const { addBill, updateBill } = useLedger();
  const { showToast } = useToast();
  const [date, setDate] = useState(bill?.date ?? todayISO());
  const [amount, setAmount] = useState(bill ? String(bill.amount) : "");
  const [note, setNote] = useState(bill?.note ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const amt = parseFloat(amount);
    if (!date || isNaN(amt) || amt <= 0) {
      setError("Please enter a valid date and amount greater than 0.");
      return;
    }
    setSaving(true);
    try {
      if (bill) {
        await updateBill(bill.id, { date, amount: amt, note: note.trim() });
        showToast("Bill updated.");
      } else {
        await addBill({ supplierId, date, amount: amt, note: note.trim() });
        showToast("Bill added.");
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={bill ? "Edit Bill" : `Add Bill — ${supplierName}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {bill ? "Save Changes" : "Add Bill"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Field label="Bill date *">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Total amount (₹) *">
            <Input
              type="number"
              min={0}
              step="0.01"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </Field>
        </div>
      </div>
      <Field label="Reference / note (optional)" error={error}>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Invoice #, material, quantity" />
      </Field>
    </Modal>
  );
}
