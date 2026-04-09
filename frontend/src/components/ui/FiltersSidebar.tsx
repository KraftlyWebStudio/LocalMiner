"use client";

import { FilterState, MAX_RADIUS_METERS, MIN_RADIUS_METERS, TriStateFilter } from "@/types/filters";
import { Place } from "@/types/place";

type FiltersSidebarProps = {
  filters: FilterState;
  allPlaces: Place[];
  resultCount: number;
  setMinRating: (rating: number | null) => void;
  setOpenNowFilter: (value: TriStateFilter) => void;
  setHasPhoneFilter: (value: TriStateFilter) => void;
  setHasWebsiteFilter: (value: TriStateFilter) => void;
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

function TriStateControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TriStateFilter;
  onChange: (next: TriStateFilter) => void;
}) {
  const options: TriStateFilter[] = ["any", "yes", "no"];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {options.map((option) => {
          const isActive = value === option;
          const optionLabel = option === "any" ? "Any" : option === "yes" ? "Yes" : "No";
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={[
                "rounded-lg border px-2 py-1.5 text-xs font-semibold transition",
                isActive
                  ? "border-sky-600 bg-sky-600 text-white shadow-[0_8px_15px_-12px_rgba(0,87,216,1)]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-300",
              ].join(" ")}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FiltersSidebar({
  filters,
  allPlaces,
  resultCount,
  setMinRating,
  setOpenNowFilter,
  setHasPhoneFilter,
  setHasWebsiteFilter,
  onRadiusChange,
  toggleCategory,
  resetFilters,
  isAnyFilterActive,
}: FiltersSidebarProps) {
  const categorySet = new Set<string>();
  for (const place of allPlaces) {
    for (const type of place.types) {
      const category = type.toLowerCase();
      categorySet.add(category);
    }
  }

  const categories = Array.from(categorySet).sort();

  const hasBusinessFilters =
    filters.openNow !== "any" || filters.hasPhone !== "any" || filters.hasWebsite !== "any";

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-sky-100 bg-white/85 shadow-[0_25px_55px_-35px_rgba(8,28,69,0.9)] backdrop-blur-sm">
      <div className="border-b border-sky-100 bg-linear-to-r from-sky-700 to-indigo-700 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-[0.14em]">Filters</h2>
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-white/35 px-2.5 py-1 text-[11px] font-semibold text-white/90 hover:bg-white/10"
            >
              Reset
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-sky-100/95">{resultCount} matching businesses</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <section className="space-y-3 rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-slate-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Rating & Radius</p>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">Minimum Rating</p>
            <div className="grid grid-cols-3 gap-2">
              {[4, 3, 2].map((rating) => {
                const isActive = filters.minRating === rating;
                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setMinRating(isActive ? null : rating)}
                    className={[
                      "rounded-lg border px-2 py-2 text-sm font-bold transition",
                      isActive
                        ? "border-sky-600 bg-sky-600 text-white shadow-[0_8px_18px_-12px_rgba(0,87,216,1)]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-sky-300",
                    ].join(" ")}
                  >
                    {rating}★+
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-sky-100" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600">Radius</p>
              <span className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-800">
                {Math.round(filters.radius / 1000)} km
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:grid-cols-5">
              {[2, 5, 10, 20, 50].map((km) => {
                const meters = km * 1000;
                const active = filters.radius === meters;
                return (
                  <button
                    key={km}
                    type="button"
                    onClick={() => onRadiusChange(meters)}
                    className={[
                      "rounded-lg border px-1 py-1 text-xs font-semibold transition",
                      active
                        ? "border-sky-600 bg-sky-600 text-white shadow-[0_8px_18px_-12px_rgba(0,87,216,1)]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-sky-300",
                    ].join(" ")}
                  >
                    {km}km
                  </button>
                );
              })}
            </div>

            <input
              type="range"
              min={MIN_RADIUS_METERS}
              max={MAX_RADIUS_METERS}
              step={500}
              value={filters.radius}
              onChange={(event) => onRadiusChange(Number(event.target.value))}
              className="w-full accent-sky-600"
            />
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-slate-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Business Filters</p>
          <div className="space-y-3">
            <TriStateControl label="Open Now" value={filters.openNow} onChange={setOpenNowFilter} />
            <TriStateControl label="Has Phone" value={filters.hasPhone} onChange={setHasPhoneFilter} />
            <TriStateControl label="Has Website" value={filters.hasWebsite} onChange={setHasWebsiteFilter} />
          </div>
          {hasBusinessFilters && <p className="text-xs font-semibold text-sky-700">Active</p>}
        </section>

        <section className="space-y-2 rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-slate-50 p-4 xl:col-span-1">
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
                    "flex items-center justify-between rounded-lg border px-2.5 py-2 text-sm transition",
                    checked
                      ? "border-sky-300 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-sky-300",
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
