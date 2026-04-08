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
    <div className="border border-zinc-700 bg-zinc-900">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search nearby places (e.g., bakery, pharmacy)"
        className="h-12 w-full border-0 bg-transparent px-4 text-sm font-medium text-zinc-100 outline-none placeholder:text-zinc-500"
        aria-label="Search place type"
      />
    </div>
  );
}
