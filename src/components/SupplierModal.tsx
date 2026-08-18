"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Button, Field, Input } from "@/components/ui";
import { useLedger } from "@/lib/ledger-context";
import { useToast } from "@/components/Toast";
import type { Supplier } from "@/lib/types";

export default function SupplierModal({
  supplier,
  onClose,
  onSaved,
}: {
  supplier?: Supplier | null;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const { addSupplier, updateSupplier } = useLedger();
  const { showToast } = useToast();
  const [name, setName] = useState(supplier?.name ?? "");
  const [phone, setPhone] = useState(supplier?.phone ?? "");
  const [notes, setNotes] = useState(supplier?.notes ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      setError("Please enter a supplier name.");
      return;
    }
    setSaving(true);
    try {
      if (supplier) {
        await updateSupplier(supplier.id, { name: name.trim(), phone: phone.trim(), notes: notes.trim() });
        showToast("Supplier updated.");
        onSaved?.(supplier.id);
      } else {
        const s = await addSupplier({ name: name.trim(), phone: phone.trim(), notes: notes.trim() });
        showToast("Supplier added.");
        onSaved?.(s.id);
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
      title={supplier ? "Edit Supplier" : "Add Supplier"}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {supplier ? "Save Changes" : "Add Supplier"}
          </Button>
        </>
      }
    >
      <Field label="Supplier / firm name *">
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rajasthan Stone Traders" />
      </Field>
      <Field label="Phone (optional)">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 98765 43210" />
      </Field>
      <Field label="Notes (optional)" error={error}>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Makrana marble supplier" />
      </Field>
    </Modal>
  );
}
