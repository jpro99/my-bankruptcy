import Decimal from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function d(value: string | number): Decimal {
  return new Decimal(value);
}

export function toMoney(dec: Decimal): string {
  return dec.toFixed(2);
}

export function sum(values: (string | Decimal)[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(typeof v === "string" ? d(v) : v), d(0));
}

export function min(a: string | Decimal, b: string | Decimal): Decimal {
  const da = typeof a === "string" ? d(a) : a;
  const db = typeof b === "string" ? d(b) : b;
  return Decimal.min(da, db);
}

export function max(a: string | Decimal, b: string | Decimal): Decimal {
  const da = typeof a === "string" ? d(a) : a;
  const db = typeof b === "string" ? d(b) : b;
  return Decimal.max(da, db);
}
