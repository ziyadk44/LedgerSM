"use client";

import { type ReactNode } from "react";

export default function Modal({
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(33,31,28,0.5)] p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`max-h-[88vh] w-full overflow-y-auto rounded-lg bg-surface shadow-2xl ${
          wide ? "max-w-[560px]" : "max-w-[440px]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border-soft px-[22px] py-[18px]">
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-[26px] w-[26px] items-center justify-center rounded text-ink-faint hover:bg-border-soft hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-[22px] py-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-border-soft px-[22px] py-4">{footer}</div>
      </div>
    </div>
  );
}
