"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLedger } from "@/lib/ledger-context";
import StatCard from "@/components/StatCard";
import BillCard from "@/components/BillCard";
import SupplierModal from "@/components/SupplierModal";
import BillModal from "@/components/BillModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { fmtMoney } from "@/lib/format";

export default function SupplierLedgerPage() {
  const params = useParams<{ id: string }>();
  const supplierId = params.id;
  const router = useRouter();
  const { suppliers, bills, loading, supplierTotals, deleteSupplier } = useLedger();
  const { showToast } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);

  if (loading) {
    return <div className="py-16 text-center text-ink-faint">Loading…</div>;
  }

  const supplier = suppliers.find((s) => s.id === supplierId);
  if (!supplier) {
    return (
      <div className="py-16 text-center text-ink-faint">
        <div className="mb-2.5 font-display text-3xl text-brass-light">◇</div>
        <h4 className="mb-1.5 font-display text-lg font-semibold text-ink">Supplier not found</h4>
        <p className="text-sm">It may have been deleted. Choose a supplier from the sidebar.</p>
      </div>
    );
  }

  const t = supplierTotals(supplier.id);
  const supplierBills = bills.filter((b) => b.supplierId === supplier.id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="mb-[18px] flex items-start justify-between">
        <div>
          <h2 className="mb-1 font-display text-2xl font-semibold">{supplier.name}</h2>
          <div className="font-mono text-[13px] text-ink-soft">
            {supplier.phone ? supplier.phone : "No phone on file"}
            {supplier.notes ? ` · ${supplier.notes}` : ""}
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowEdit(true)}
            className="rounded border border-border bg-surface px-2.5 py-1.5 text-xs font-medium hover:bg-surface-2"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="rounded border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-surface-2"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mb-[22px] grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Billed" value={fmtMoney(t.billed)} />
        <StatCard label="Total Paid" value={fmtMoney(t.paid)} tone="paid" />
        <StatCard label="Balance Due" value={fmtMoney(t.due)} tone="due" />
      </div>

      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Bills</h3>
        <button
          onClick={() => setShowAddBill(true)}
          className="rounded border border-brass bg-brass px-3 py-1.5 text-xs font-medium text-white hover:bg-[#7F6329]"
        >
          + Add Bill
        </button>
      </div>

      {supplierBills.length === 0 ? (
        <div className="py-16 text-center text-ink-faint">
          <div className="mb-2.5 font-display text-3xl text-brass-light">▤</div>
          <h4 className="mb-1.5 font-display text-lg font-semibold text-ink">No bills yet</h4>
          <p className="mb-4 text-sm">Record a purchase bill from {supplier.name} to begin tracking installments against it.</p>
          <button
            onClick={() => setShowAddBill(true)}
            className="rounded border border-brass bg-brass px-4 py-2 text-sm font-medium text-white hover:bg-[#7F6329]"
          >
            + Add Bill
          </button>
        </div>
      ) : (
        supplierBills.map((b) => <BillCard key={b.id} bill={b} supplierName={supplier.name} />)
      )}

      {showEdit && <SupplierModal supplier={supplier} onClose={() => setShowEdit(false)} />}
      {showAddBill && (
        <BillModal supplierId={supplier.id} supplierName={supplier.name} onClose={() => setShowAddBill(false)} />
      )}
      {showDelete && (
        <ConfirmDialog
          title="Delete Supplier"
          message={`Delete ${supplier.name}? This will also delete ${supplierBills.length} bill(s) and all associated payments. This cannot be undone.`}
          confirmLabel="Delete Supplier"
          onClose={() => setShowDelete(false)}
          onConfirm={async () => {
            await deleteSupplier(supplier.id);
            showToast("Supplier deleted.");
            router.push("/");
          }}
        />
      )}
    </div>
  );
}
