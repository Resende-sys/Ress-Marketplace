import type { License } from "./types";

/** Menor preço entre as licenças não exclusivas ("a partir de"). */
export function fromPrice(licenses: License[]) {
  const prices = licenses.filter((l) => !l.isExclusive).map((l) => l.priceCents);
  return prices.length ? Math.min(...prices) : null;
}
