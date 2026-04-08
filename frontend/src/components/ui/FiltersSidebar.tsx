"use client";

import { FilterState } from "@/types/filters";
import { Place } from "@/types/place";

type FiltersSidebarProps = {
  filters: FilterState;
  allPlaces: Place[];
  resultCount: number;
  setMinRating: (rating: number | null) => void;
  toggleOpenNow: () => void;
  toggleHasPhone: () => void;
  toggleHasWebsite: () => void;
  onRadiusChange: (meters: number) => void;
  toggleCategory: (category: string) => void;
  resetFilters: () => void;
  isAnyFilterActive: boolean;
};

function formatCategory(type: string): string {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function FilterToggle({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "flex w-full items-center justify-between border px-3 py-2 text-sm font-medium transition-colors",
        checked
          ? "border-red-400 bg-red-50 text-red-700"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
      ].join(" ")}
    >
      <span>{label}</span>
      <span
        className={[
          "inline-flex h-5 w-5 items-center justify-center border text-xs font-bold",
          checked
            ? "border-red-500 bg-red-600 text-white"
            : "border-slate-300 bg-white text-slate-400",
        ].join(" ")}
      >
        {checked ? "✓" : ""}
      </span>
    </button>
  );
}

export default function FiltersSidebar({
  filters,
  allPlaces,
  resultCount,
  setMinRating,
  toggleOpenNow,
  toggleHasPhone,
  toggleHasWebsite,
  onRadiusChange,
  toggleCategory,
  resetFilters,
  isAnyFilterActive,
}: FiltersSidebarProps) {
  const categorySet = new Set<string>();
  for (const place of allPlaces) {
    const category = (place.types[0] ?? "unknown").toLowerCase();
    categorySet.add(category);
  }

  const categories = Array.from(categorySet).sort();

  const hasBusinessFilters = filters.openNow || filters.hasPhone || filters.hasWebsite;

  return (
    <aside className="flex h-full w-full flex-col border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-4 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-[0.12em]">Filters</h2>
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="border border-white/30 px-2 py-1 text-[11px] font-semibold text-white/90 hover:bg-white/10"
            >
              Reset
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-white/70">{resultCount} matching businesses</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <section className="space-y-2 border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Minimum Rating</p>
          <div className="grid grid-cols-3 gap-2">
            {[4, 3, 2].map((rating) => {
              const isActive = filters.minRating === rating;
              return (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setMinRating(isActive ? null : rating)}
                  className={[
                    "border px-2 py-2 text-sm font-bold",
                    isActive
                      ? "border-red-500 bg-red-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                  ].join(" ")}
                >
                  {rating}★+
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2 border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Business Filters</p>
          <div className="space-y-2">
            <FilterToggle label="Open Now" checked={filters.openNow} onToggle={toggleOpenNow} />
            <FilterToggle label="Has Phone" checked={filters.hasPhone} onToggle={toggleHasPhone} />
            <FilterToggle label="Has Website" checked={filters.hasWebsite} onToggle={toggleHasWebsite} />
          </div>
          {hasBusinessFilters && <p className="text-xs font-semibold text-red-600">Active</p>}
        </section>

        <section className="space-y-3 border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Radius</p>
            <span className="border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
              {Math.round(filters.radius / 1000)} km
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
            {[2, 5, 10, 20, 50, 100].map((km) => {
              const meters = km * 1000;
              const active = filters.radius === meters;
              return (
                <button
                  key={km}
                  type="button"
                  onClick={() => onRadiusChange(meters)}
                  className={[
                    "border px-1 py-1 text-xs font-semibold",
                    active
                      ? "border-red-500 bg-red-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                  ].join(" ")}
                >
                  {km}km
                </button>
              );
            })}
          </div>

          <input
            type="range"
            min={1000}
            max={100000}
            step={500}
            value={filters.radius}
            onChange={(event) => onRadiusChange(Number(event.target.value))}
            className="w-full accent-red-500"
          />
        </section>

        <section className="space-y-2 border border-slate-200 bg-slate-50 p-3 xl:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Categories</p>
            <span className="text-xs font-semibold text-slate-500">{filters.categories.length} selected</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {categories.map((category) => {
              const checked = filters.categories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={[
                    "flex items-center justify-between border px-2.5 py-2 text-sm",
                    checked
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                  ].join(" ")}
                >
                  <span>{formatCategory(category)}</span>
                  <span className="text-xs font-bold">{checked ? "✓" : "+"}</span>
                </button>
              );
            })}
          </div>
        </section>
        </div>
      </div>
    </aside>
  );
}
