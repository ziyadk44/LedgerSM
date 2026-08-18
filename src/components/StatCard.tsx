export default function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "paid" | "due";
}) {
  const valueColor = tone === "paid" ? "text-green" : tone === "due" ? "text-amber" : "text-ink";
  return (
    <div className="rounded-lg border border-border-soft bg-surface px-[18px] py-4">
      <div className="mb-2 text-[11px] uppercase tracking-[0.08em] text-ink-faint">{label}</div>
      <div className={`font-mono text-[22px] font-semibold ${valueColor}`}>{value}</div>
    </div>
  );
}
