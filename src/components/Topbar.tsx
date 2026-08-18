"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function lock() {
    setLoggingOut(true);
    try {
      await fetch("/api/login", { method: "DELETE" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="flex h-16 shrink-0 items-center justify-between bg-gradient-to-r from-granite to-granite-3 px-4 text-[#F4F1EA] sm:px-[22px]">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Menu"
          className="mr-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10 md:hidden"
        >
          ☰
        </button>
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gradient-to-br from-brass-light to-brass font-display text-[15px] font-semibold text-white">
          SM
        </div>
        <div>
          <h1 className="font-display text-[19px] font-semibold leading-tight tracking-tight">Shariq Marbles</h1>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#B8A98A]">Supplier Payment Ledger</p>
        </div>
      </div>
      <button
        onClick={lock}
        disabled={loggingOut}
        title="Lock"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-50"
      >
        🔒
      </button>
    </div>
  );
}
