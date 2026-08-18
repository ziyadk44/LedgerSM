"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLedger } from "@/lib/ledger-context";
import { fmtMoney } from "@/lib/format";
import SupplierModal from "@/components/SupplierModal";

export default function Sidebar({
  mobileOpen = false,
  onNavigate,
}: {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const { suppliers, supplierTotals } = useLedger();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const activeSupplierId = pathname?.startsWith("/suppliers/") ? pathname.split("/")[2] : null;

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...suppliers].sort((a, b) => a.name.localeCompare(b.name));
    return q ? sorted.filter((s) => s.name.toLowerCase().includes(q)) : sorted;
  }, [suppliers, search]);

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 top-[74px] z-40 flex w-72 shrink-0 flex-col bg-granite text-[#EFEAE0] transition-transform duration-200 md:static md:top-auto md:z-auto md:w-[280px] md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
       >
     
        <div className="px-[18px] pb-[10px] pt-[18px]">
          <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#B8A98A]">
            Suppliers · {suppliers.length}
          </h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers…"
            className="w-full rounded border border-white/15 bg-white/5 px-3 py-[9px] text-[13px] text-[#F4F1EA] placeholder:text-[#8C877D] focus:border-brass-light focus:outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-2.5 pb-2.5 pt-1">
          {suppliers.length === 0 ? (
            <div className="px-2 py-3 text-[12.5px] leading-relaxed text-[#8C877D]">
              No suppliers yet. Add your first stone supplier to start tracking payments.
            </div>
          ) : list.length === 0 ? (
            <div className="px-2 py-3 text-[12.5px] leading-relaxed text-[#8C877D]">
              No suppliers match &ldquo;{search}&rdquo;.
            </div>
          ) : (
            list.map((s) => {
              const t = supplierTotals(s.id);
              const active = s.id === activeSupplierId;
              let pill;
              if (t.billCount === 0) {
                pill = <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px] text-ink-faint">No bills yet</span>;
              } else if (t.due <= 0.01) {
                pill = <span className="rounded-full bg-[rgba(62,102,80,0.25)] px-2 py-0.5 font-mono text-[11px] text-[#96C7AB]">Settled</span>;
              } else {
                pill = (
                  <span className="rounded-full bg-[rgba(166,116,43,0.22)] px-2 py-0.5 font-mono text-[11px] text-[#E4BE7C]">
                    {fmtMoney(t.due)} due
                  </span>
                );
              }
              return (
                <Link
                  key={s.id}
                  href={`/suppliers/${s.id}`}
                  onClick={onNavigate}
                  className={`mb-[5px] block rounded border px-3 py-[11px] transition-colors ${
                    active ? "border-[rgba(183,150,87,0.4)] bg-[rgba(183,150,87,0.16)]" : "border-transparent hover:bg-white/5"
                  }`}
                >
                  <div className="mb-[5px] text-sm font-medium">{s.name}</div>
                  <div>{pill}</div>
                </Link>
              );
            })
          )}
        </div>
        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => setShowAdd(true)}
            className="w-full rounded border border-dashed border-[rgba(183,150,87,0.5)] py-[11px] text-[13px] font-medium text-brass-light hover:bg-[rgba(183,150,87,0.1)]"
          >
            + Add Supplier
          </button>
        </div>
      </div>
      {showAdd && <SupplierModal onClose={() => setShowAdd(false)} />}
    </>
  );
}
