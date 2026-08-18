import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "shariq_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    throw new Error(
      "SESSION_SECRET is not configured. Add it to your environment variables (see README.md)."
    );
  }
  return s;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Builds a signed session token: "<expiryEpoch>.<hmac>" */
export function createSessionToken(): string {
  const expiry = Date.now() + THIRTY_DAYS * 1000;
  const payload = String(expiry);
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if (Number(payload) < Date.now()) return false;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function checkPin(pin: string): boolean {
  const configured = process.env.APP_PIN;
  if (!configured) {
    throw new Error(
      "APP_PIN is not configured. Add it to your environment variables (see README.md)."
    );
  }
  if (pin.length !== configured.length) return false;
  const a = Buffer.from(pin);
  const b = Buffer.from(configured);
  return timingSafeEqual(a, b);
}

export const SESSION_MAX_AGE = THIRTY_DAYS;
