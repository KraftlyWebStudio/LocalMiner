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

  return (
    <aside className="flex h-full w-full flex-col border border-zinc-800 bg-zinc-900/95">
      <div className="border-b border-zinc-800 bg-zinc-950/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-[0.08em] text-zinc-100">Filters</h2>
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-red-300 hover:text-red-200"
            >
              Reset
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-400">{resultCount} matching businesses</p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <section className="space-y-2 border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Minimum Rating</p>
          <div className="grid grid-cols-3 gap-2">
            {[4, 3, 2].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setMinRating(filters.minRating === rating ? null : rating)}
                className={[
                  "border px-2 py-1.5 text-xs font-semibold",
                  filters.minRating === rating
                    ? "border-red-500 bg-red-950/30 text-red-300"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-500",
                ].join(" ")}
              >
                {rating}★+
              </button>
            ))}
          </div>
          {filters.minRating !== null && <p className="text-xs text-red-300">Active</p>}
        </section>

        <section className="space-y-2 border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Business Filters</p>
          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm text-zinc-200">
              <span>Open Now</span>
              <input
                type="checkbox"
                checked={filters.openNow}
                onChange={toggleOpenNow}
                className="h-4 w-4 accent-red-500"
              />
            </label>
            <label className="flex items-center justify-between text-sm text-zinc-200">
              <span>Has Phone</span>
              <input
                type="checkbox"
                checked={filters.hasPhone}
                onChange={toggleHasPhone}
                className="h-4 w-4 accent-red-500"
              />
            </label>
            <label className="flex items-center justify-between text-sm text-zinc-200">
              <span>Has Website</span>
              <input
                type="checkbox"
                checked={filters.hasWebsite}
                onChange={toggleHasWebsite}
                className="h-4 w-4 accent-red-500"
              />
            </label>
          </div>
          {(filters.openNow || filters.hasPhone || filters.hasWebsite) && (
            <p className="text-xs text-red-300">Active</p>
          )}
        </section>

        <section className="space-y-2 border border-zinc-800 bg-zinc-950/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Radius</p>
            <span className="text-xs font-semibold text-zinc-300">{Math.round(filters.radius / 1000)} km</span>
          </div>
          <input
            type="range"
            min={1000}
            max={20000}
            step={500}
            value={filters.radius}
            onChange={(event) => onRadiusChange(Number(event.target.value))}
            className="w-full accent-red-500"
          />
          {filters.radius !== 5000 && <p className="text-xs text-red-300">Active</p>}
        </section>

        <section className="space-y-2 border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Categories</p>
          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {categories.map((category) => {
              const checked = filters.categories.includes(category);
              return (
                <label key={category} className="flex items-center justify-between text-sm text-zinc-200">
                  <span>{formatCategory(category)}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(category)}
                    className="h-4 w-4 accent-red-500"
                  />
                </label>
              );
            })}
          </div>
          {filters.categories.length > 0 && (
            <p className="text-xs text-red-300">{filters.categories.length} active</p>
          )}
        </section>
      </div>
    </aside>
  );
}
