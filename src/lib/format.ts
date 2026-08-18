export function fmtMoney(n: number): string {
  const v = Number(n) || 0;
  return (
    "₹" +
    v.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: v % 1 !== 0 ? 2 : 0,
    })
  );
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function todayISO(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}
