"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLedger } from "@/lib/ledger-context";

export default function NavTabs() {
  const pathname = usePathname();
  const { supplierName } = useLedger();

  const isOverview = pathname === "/";
  const isPayments = pathname === "/payments";
  const supplierId = pathname?.startsWith("/suppliers/") ? pathname.split("/")[2] : null;

  const tabClass = (active: boolean) =>
    `border-b-2 px-4 py-2.5 text-[13.5px] font-medium ${
      active ? "border-brass text-ink" : "border-transparent text-ink-soft hover:text-ink"
    }`;

  return (
    <div className="flex gap-0.5 overflow-x-auto whitespace-nowrap bg-bg px-4 pt-3.5 sm:px-7">
      <Link href="/" className={tabClass(isOverview)}>
        Overview
      </Link>
      {supplierId && <span className={tabClass(true)}>{supplierName(supplierId)}</span>}
      <Link href="/payments" className={tabClass(isPayments)}>
        All Payments
      </Link>
    </div>
  );
}
