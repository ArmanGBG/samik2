// Iranian mobile number helpers

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/**
 * Normalize any Iranian mobile input to 09xxxxxxxxx format.
 * Returns null when invalid.
 * Accepts: 09123456789, +989123456789, 00989123456789, 989123456789, 9123456789, Persian digits
 */
export function normalizeMobile(raw: string): string | null {
  if (!raw) return null;
  let s = toEnglishDigits(raw).replace(/[\s\-()]/g, "").trim();

  if (s.startsWith("+98")) s = "0" + s.slice(3);
  else if (s.startsWith("0098")) s = "0" + s.slice(4);
  else if (s.startsWith("98") && s.length === 12) s = "0" + s.slice(2);
  else if (s.startsWith("9") && s.length === 10) s = "0" + s;

  if (!/^09\d{9}$/.test(s)) return null;
  return s;
}

export function isValidMobile(raw: string): boolean {
  return normalizeMobile(raw) !== null;
}

/** Validate Iranian bank card number (16 digits, Luhn check optional) */
export function isValidBankCard(raw: string): boolean {
  const s = toEnglishDigits(raw).replace(/[\s\-]/g, "");
  if (!/^\d{16}$/.test(s)) return false;
  // Luhn
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let d = Number(s[i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** Validate Sheba (IR + 24 digits) */
export function isValidSheba(raw: string): boolean {
  const s = toEnglishDigits(raw).replace(/[\s\-]/g, "").toUpperCase();
  if (!/^IR\d{24}$/.test(s)) return false;
  // Basic mod-97 check
  const rearranged = s.slice(4) + "1827" + s.slice(2, 4); // "IR" -> 18 27
  let remainder = 0;
  for (const ch of rearranged) {
    remainder = (remainder * 10 + Number(ch)) % 97;
  }
  return remainder === 1;
}
