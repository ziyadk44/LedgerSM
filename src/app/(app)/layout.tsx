import { ToastProvider } from "@/components/Toast";
import { LedgerProvider } from "@/lib/ledger-context";
import AppShell from "@/components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <LedgerProvider>
        <AppShell>{children}</AppShell>
      </LedgerProvider>
    </ToastProvider>
  );
}