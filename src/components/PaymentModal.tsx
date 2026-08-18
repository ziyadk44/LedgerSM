"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Button, Field, Input } from "@/components/ui";
import { useLedger } from "@/lib/ledger-context";
import { useToast } from "@/components/Toast";
import { fmtDate, fmtMoney, todayISO } from "@/lib/format";
import type { Payment, PaymentMode } from "@/lib/types";

export default function PaymentModal({
  billId,
  billLabel,
  dueAmount,
  payment,
  onClose,
}: {
  billId: string;
  billLabel?: string;
  dueAmount?: number;
  payment?: Payment | null;
  onClose: () => void;
}) {
  const { addPayment, updatePayment } = useLedger();
  const { showToast } = useToast();
  const [date, setDate] = useState(payment?.date ?? todayISO());
  const [amount, setAmount] = useState(payment ? String(payment.amount) : "");
  const [mode, setMode] = useState<PaymentMode>(payment?.mode ?? "cash");
  const [note, setNote] = useState(payment?.note ?? "");
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
      if (payment) {
        await updatePayment(payment.id, { date, amount: amt, mode, note: note.trim() });
        showToast("Payment updated.");
      } else {
        await addPayment({ billId, date, amount: amt, mode, note: note.trim() });
        showToast("Payment added.");
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
      title={payment ? "Edit Payment" : "Add Payment"}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {payment ? "Save Changes" : "Add Payment"}
          </Button>
        </>
      }
    >
      {billLabel && (
        <p className="mt-0 mb-4 text-[12.5px] text-ink-soft">
          {billLabel}
          {typeof dueAmount === "number" && (
            <>
              {" · "}
              <strong className="text-amber">{fmtMoney(dueAmount)} still due</strong>
            </>
          )}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Field label="Payment date *">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Amount (₹) *">
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
      <Field label="Payment mode *">
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setMode("cash")}
            className={`flex-1 rounded border-[1.5px] px-3 py-2.5 text-sm font-medium ${
              mode === "cash" ? "border-brass bg-brass-bg text-[#5A461B]" : "border-border text-ink-soft"
            }`}
          >
            Cash
          </button>
          <button
            type="button"
            onClick={() => setMode("online")}
            className={`flex-1 rounded border-[1.5px] px-3 py-2.5 text-sm font-medium ${
              mode === "online" ? "border-brass bg-brass-bg text-[#5A461B]" : "border-border text-ink-soft"
            }`}
          >
            Online / Cheque
          </button>
        </div>
      </Field>
      <Field label="Reference / note (optional)" error={error}>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. cheque no., UTR, remarks" />
      </Field>
    </Modal>
  );
}
