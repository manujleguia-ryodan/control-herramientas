import crypto from "node:crypto";

const KEYLEN = 64;
export function hashPin(pin: string) {
  if (!/^\d{4}$/.test(pin)) throw new Error("El PIN debe tener exactamente 4 dígitos");
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pin, salt, KEYLEN).toString("hex");
  return `scrypt:${salt}:${hash}`;
}
export function verifyPin(pin: string, stored: string) {
  if (!/^\d{4}$/.test(pin) || !stored.startsWith("scrypt:")) return false;
  const [, salt, expected] = stored.split(":");
  const actual = crypto.scryptSync(pin, salt, KEYLEN).toString("hex");
  return expected.length === actual.length && crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
}
