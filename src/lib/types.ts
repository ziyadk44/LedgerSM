export type Supplier = {
  id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: number;
};

export type Bill = {
  id: string;
  supplierId: string;
  date: string; // ISO yyyy-mm-dd
  amount: number;
  note: string;
  createdAt: number;
};

export type PaymentMode = "cash" | "online";

export type Payment = {
  id: string;
  billId: string;
  date: string; // ISO yyyy-mm-dd
  amount: number;
  mode: PaymentMode;
  note: string;
  createdAt: number;
};

export type LedgerData = {
  suppliers: Supplier[];
  bills: Bill[];
  payments: Payment[];
};
