"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import NavTabs from "@/components/NavTabs";

function VeinDivider() {
  return (
    <div className="h-2.5 w-full overflow-hidden leading-none">
      <svg viewBox="0 0 1200 10" preserveAspectRatio="none" className="block h-2.5 w-full">
        <path
          d="M0,5 C120,2 180,8 260,4 C340,1 400,9 480,5 C560,2 620,8 700,4 C800,0 880,9 960,5 C1040,2 1120,7 1200,4"
          fill="none"
          stroke="#93712F"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Topbar onMenuClick={() => setMobileOpen((v) => !v)} />
      <VeinDivider />
      <div className="relative flex min-h-0 flex-1">
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
        <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <NavTabs />
          <div className="flex-1 overflow-y-auto px-4 pb-16 pt-5 sm:px-7">{children}</div>
        </div>
      </div>
    </>
  );
}