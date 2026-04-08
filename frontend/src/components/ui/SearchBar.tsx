"use client";

import { useEffect, useState } from "react";

type SearchBarProps = {
  defaultValue?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
};

export default function SearchBar({
  defaultValue = "restaurant",
  onSearch,
  debounceMs = 400,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onSearch(value.trim() || "restaurant");
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, onSearch, value]);

  return (
    <div className="border border-slate-300 bg-white shadow-sm focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search nearby places (e.g., bakery, pharmacy)"
        className="h-12 w-full border-0 bg-transparent px-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
        aria-label="Search place type"
      />
    </div>
  );
}
