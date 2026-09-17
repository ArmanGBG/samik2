// Jalali (Shamsi) date helpers — server & client safe
import { format, newDate } from "date-fns-jalali";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toPersianDigitsSafe(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

function toEnglishDigitsLocal(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

/** Format a Date to Jalali string like 1403/08/15 */
export function toJalaliString(date: Date | string, pattern = "yyyy/MM/dd"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return format(d, pattern);
  } catch {
    return "—";
  }
}

/** ۱۴۰۳/۰۸/۱۵ (Persian digits) */
export function toJalaliPersian(date: Date | string): string {
  return toPersianDigitsSafe(toJalaliString(date));
}

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const JALALI_WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

/** Long form: شنبه، ۱۵ آبان ۱۴۰۳ */
export function toJalaliLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  try {
    const y = Number(format(d, "yyyy"));
    const m = Number(format(d, "MM"));
    const day = Number(format(d, "dd"));
    const wd = JALALI_WEEKDAYS[(d.getDay() + 1) % 7];
    return toPersianDigitsSafe(`${wd}، ${day} ${JALALI_MONTHS[m - 1]} ${y}`);
  } catch {
    return "—";
  }
}

export function jalaliMonthName(month: number): string {
  return JALALI_MONTHS[month - 1] ?? "";
}

/** Parse "yyyy/MM/dd" Jalali input (from react-multi-date-picker) to a JS Date at local noon */
export function parseJalaliString(jalali: string): Date | null {
  const m = toEnglishDigitsLocal(jalali.trim()).match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  try {
    // newDate(year, monthIndex(0-based), day, hour) — jalali parts
    return newDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  } catch {
    return null;
  }
}
