"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PROVINCE_NAMES, getCitiesOfProvince } from "@/lib/iran";

interface ProvinceCitySelectProps {
  province: string;
  city: string;
  onProvinceChange: (p: string) => void;
  onCityChange: (c: string) => void;
  id?: string;
}

/** Cascading Province → City selects for Iran geography */
export function ProvinceCitySelect({
  province,
  city,
  onProvinceChange,
  onCityChange,
  id,
}: ProvinceCitySelectProps) {
  const cities = useMemo(() => getCitiesOfProvince(province), [province]);
  const [citySearch, setCitySearch] = useState("");

  useEffect(() => {
    if (province && city && !cities.includes(city)) onCityChange("");
  }, [province]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor={`${id}-province`}>استان</Label>
        <Select value={province || undefined} onValueChange={onProvinceChange}>
          <SelectTrigger id={`${id}-province`} className="w-full h-11 bg-card">
            <SelectValue placeholder="انتخاب استان" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {PROVINCE_NAMES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-city`}>شهر</Label>
        <Select
          value={city || undefined}
          onValueChange={onCityChange}
          disabled={!province}
        >
          <SelectTrigger id={`${id}-city`} className="w-full h-11 bg-card">
            <SelectValue placeholder={province ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <div className="p-2">
              <input
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="جستجوی شهر…"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            {cities
              .filter((c) => !citySearch || c.includes(citySearch))
              .map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
