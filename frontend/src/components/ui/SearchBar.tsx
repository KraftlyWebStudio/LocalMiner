"use client";

import { useEffect, useState } from "react";

type SearchBarProps = {
  defaultValue?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
};

export default function SearchBar({
  defaultValue = "",
  onSearch,
  debounceMs = 400,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onSearch(value.trim());
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, onSearch, value]);

  return (
    <div className="rounded-2xl border border-sky-200/80 bg-white/95 shadow-[0_10px_25px_-18px_rgba(15,35,95,0.65)] backdrop-blur-sm transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search nearby places (e.g., bakery, pharmacy)"
        className="h-13 w-full border-0 bg-transparent px-5 text-[15px] font-medium text-slate-800 outline-none placeholder:text-slate-400"
        aria-label="Search place type"
      />
    </div>
  );
}
