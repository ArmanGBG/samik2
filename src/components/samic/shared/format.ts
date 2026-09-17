/** Small formatting helpers shared across panels */

export function normalizeMobileDisplay(mobile: string): string {
  return mobile;
}

export function fullName(name: string | null, lastName: string | null, fallback = "بدون نام"): string {
  const s = `${name ?? ""} ${lastName ?? ""}`.trim();
  return s || fallback;
}
