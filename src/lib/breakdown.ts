import type { Bill, Payment } from "@/lib/types";

const round = (n: number) => Math.round(n * 100) / 100;

/** Returns null when the bill is not split into cash/online. */
export function getBreakdown(bill: Bill, payments: Payment[]) {
  if (bill.cashAmount === null || bill.cashAmount === undefined) return null;
  const cashTotal = bill.cashAmount;
  const onlineTotal = round(bill.amount - cashTotal);
  const mine = payments.filter((p) => p.billId === bill.id);
  const cashPaid = mine.filter((p) => p.mode === "cash").reduce((s, p) => s + Number(p.amount), 0);
  const onlinePaid = mine.filter((p) => p.mode === "online").reduce((s, p) => s + Number(p.amount), 0);
  return {
    cashTotal,
    onlineTotal,
    cashPaid,
    onlinePaid,
    cashDue: round(cashTotal - cashPaid),
    onlineDue: round(onlineTotal - onlinePaid),
  };
}