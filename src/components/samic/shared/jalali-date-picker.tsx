"use client";

import DatePicker, { DateObject } from "react-multi-date-picker";
import { Label } from "@/components/ui/label";
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_en";
import persian_fa from "react-date-object/locales/persian_fa";
import { CalendarDays } from "lucide-react";

interface JalaliDatePickerProps {
  value: string; // "yyyy/MM/dd" Jalali (English digits)
  onChange: (jalali: string) => void;
  label?: string;
  id?: string;
}

/** Jalali (Shamsi) date picker — react-multi-date-picker wrapper.
 *  NOTE: DateObject MUST receive the imported `persian` calendar OBJECT —
 *  passing the string "persian" silently keeps the Gregorian calendar. */
export function JalaliDatePicker({ value, onChange, label, id }: JalaliDatePickerProps) {
  const dateObject = value
    ? new DateObject({ date: value, calendar: persian, locale: persian_en, format: "YYYY/MM/DD" })
    : "";

  return (
    <div className="space-y-2">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="relative">
        <DatePicker
          id={id}
          calendar={persian}
          locale={persian_fa}
          value={dateObject}
          onChange={(dateObj) => {
            if (dateObj instanceof DateObject) {
              const persianEn = new DateObject({
                year: dateObj.year,
                month: dateObj.month,
                day: dateObj.day,
                calendar: persian,
                locale: persian_en,
                format: "YYYY/MM/DD",
              });
              onChange(persianEn.format());
            } else {
              onChange("");
            }
          }}
          format="YYYY/MM/DD"
          calendarPosition="bottom-right"
          editable
          containerClassName="w-full"
          inputClass="w-full h-11 rounded-lg border border-input bg-card px-3 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40 cursor-pointer"
          placeholder="1403/08/15"
        />
        <CalendarDays className="size-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}

/** Today as Jalali "yyyy/MM/dd" string (English digits) */
export function todayJalali(): string {
  const d = new DateObject({ calendar: persian, locale: persian_en, format: "YYYY/MM/DD" });
  return d.format();
}
