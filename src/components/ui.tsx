"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "default",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "danger" | "ghost" }) {
  const base = "inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    default: "border border-border bg-surface text-ink hover:bg-surface-2",
    primary: "border border-brass bg-brass text-white hover:bg-[#7F6329]",
    danger: "border border-danger bg-danger text-white hover:bg-[#8a3a26]",
    ghost: "border border-transparent bg-transparent text-ink hover:bg-surface-2",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[12.5px] font-medium text-ink-soft">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11.5px] text-ink-faint">{hint}</p>}
      {error && <p className="mt-1 text-[11.5px] text-danger">{error}</p>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded border border-border bg-surface px-3 py-2.5 text-[13.5px] text-ink focus:border-brass focus:outline-none ${props.className ?? ""}`}
    />
  );
}
