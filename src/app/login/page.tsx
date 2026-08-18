"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(value: string) {
    if (value.length < 4 || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: value }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error || "Incorrect PIN.");
        setPin("");
        setShake(true);
        setTimeout(() => setShake(false), 350);
        return;
      }
      const next = searchParams.get("next") || "/";
      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Check your connection.");
      setPin("");
    } finally {
      setSubmitting(false);
    }
  }

  function press(key: string) {
    if (key === "clear") {
      setPin("");
      return;
    }
    if (key === "back") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 6) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 6) submit(next);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
      else if (e.key === "Enter") submit(pin);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-granite-3 to-granite p-5">
      <div className={`w-full max-w-[400px] rounded-lg bg-surface px-9 pb-8 pt-10 shadow-2xl ${shake ? "shake" : ""}`}>
        <div className="mb-1.5 text-center">
          <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brass-light to-brass font-display text-[19px] font-semibold text-white shadow-md">
            SM
          </div>
          <h1 className="mb-0.5 font-display text-[26px] font-semibold tracking-tight">Shariq Marbles</h1>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-ink-faint">Supplier Ledger</p>
        </div>
        <div className="mb-5 mt-[18px] text-center text-[13.5px] text-ink-soft">
          <strong className="mb-0.5 block text-sm text-ink">Welcome back</strong>
          Enter your PIN to open the ledger.
        </div>
        <div className="my-[22px] flex justify-center gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-3.5 w-3.5 rounded-full border-[1.5px] transition-all ${
                i < pin.length ? "scale-105 border-ink bg-ink" : "border-border"
              }`}
            />
          ))}
        </div>
        <div className="min-h-[16px] text-center text-[12.5px] text-danger">{error}</div>
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              className={
                k === "clear" || k === "back"
                  ? "h-14 rounded-lg border border-border-soft bg-surface-2 text-[12.5px] font-medium text-ink-soft hover:bg-border-soft"
                  : "h-14 rounded-lg border border-border-soft bg-surface-2 font-display text-lg text-ink hover:bg-border-soft active:scale-95"
              }
            >
              {k === "clear" ? "Clear" : k === "back" ? "⌫" : k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
