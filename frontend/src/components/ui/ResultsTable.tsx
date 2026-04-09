"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Place } from "@/types/place";

interface ResultsTableProps {
  places: Place[];
  isLoading: boolean;
  selectedPlaceId: string | null;
  onSelectPlace: (place: Place) => void;
  onExportSelected: (places: Place[]) => void;
}

function formatCategory(type: string): string {
  if (!type) {
    return "Unknown";
  }

  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatCategoryList(types: string[]): string {
  if (!types.length) {
    return "Unknown";
  }

  return types.slice(0, 2).map(formatCategory).join(", ");
}

function renderStars(rating: number): string {
  const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  const filled = Math.round(safeRating);
  const empty = 5 - filled;
  return `${"★".repeat(filled)}${"☆".repeat(empty)}`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

export default function ResultsTable({
  places,
  isLoading,
  selectedPlaceId,
  onSelectPlace,
  onExportSelected,
}: ResultsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const allIds = useMemo(() => places.map((place) => place.placeId), [places]);

  const selectedPlaces = useMemo(() => {
    return places.filter((place) => selectedIds.has(place.placeId));
  }, [places, selectedIds]);

  const selectedCountInCurrentRows = selectedPlaces.length;
  const allSelected = places.length > 0 && selectedCountInCurrentRows === places.length;
  const someSelected = selectedCountInCurrentRows > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const handleToggleRow = (placeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) {
        next.delete(placeId);
      } else {
        next.add(placeId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (allSelected || someSelected) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(allIds));
  };

  const handleCopy = async (value: string) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard write can fail in non-secure contexts.
    }
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-sky-100 bg-white/90 shadow-[0_30px_60px_-40px_rgba(9,30,80,0.9)] backdrop-blur-sm">
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-330 border-collapse text-sm text-slate-700">
          <thead className="sticky top-0 z-10 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-xs uppercase tracking-wide text-slate-100">
            <tr>
              <th className="sticky left-0 z-10 w-12 border-b border-slate-700 bg-slate-900 px-3 py-3 text-left">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAll}
                  aria-label="Select all rows"
                  className="h-4 w-4 accent-sky-500"
                />
              </th>
              <th className="w-12 border-b border-slate-700 px-3 py-3 text-left">#</th>
              <th className="sticky left-12 z-10 min-w-50 border-b border-slate-700 bg-slate-900 px-3 py-3 text-left">
                Business Name
              </th>
              <th className="min-w-37.5 border-b border-slate-700 px-3 py-3 text-left">Category</th>
              <th className="min-w-57.5 border-b border-slate-700 px-3 py-3 text-left">Address</th>
              <th className="min-w-37.5 border-b border-slate-700 px-3 py-3 text-left">Phone</th>
              <th className="min-w-37.5 border-b border-slate-700 px-3 py-3 text-left">Rating</th>
              <th className="min-w-27.5 border-b border-slate-700 px-3 py-3 text-left">Website</th>
              <th className="min-w-25 border-b border-slate-700 px-3 py-3 text-left">Maps Link</th>
              <th className="min-w-47.5 border-b border-slate-700 px-3 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr key={`skeleton-${rowIdx}`} className="animate-pulse border-b border-slate-200">
                  {Array.from({ length: 10 }).map((__, colIdx) => (
                    <td key={`cell-${rowIdx}-${colIdx}`} className="px-3 py-3">
                      <div className="h-4 w-full bg-slate-200" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && places.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-14 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">🔎</span>
                    <p className="text-sm font-medium">No results found</p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              places.map((place, index) => {
                const isActive = selectedPlaceId === place.placeId;
                const isChecked = selectedIds.has(place.placeId);
                const mapsUrl = place.mapsUrl ?? `https://www.google.com/maps/place/?q=place_id:${place.placeId}`;
                const phoneValue = place.phoneNumber ?? "";
                const websiteValue = place.website ?? "";

                return (
                  <tr
                    key={place.placeId}
                    onClick={() => onSelectPlace(place)}
                    className={[
                      "cursor-pointer border-b border-slate-100 transition hover:bg-sky-50/45",
                      isActive ? "border-l-4 border-sky-500 bg-sky-50/70" : "",
                    ].join(" ")}
                  >
                    <td
                      className="sticky left-0 z-1 bg-white px-3 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleRow(place.placeId)}
                        aria-label={`Select ${place.name}`}
                        className="h-4 w-4 accent-sky-500"
                      />
                    </td>

                    <td className="px-3 py-3 text-slate-500">{index + 1}</td>

                    <td className="sticky left-12 z-1 bg-white px-3 py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectPlace(place);
                        }}
                        className="font-semibold text-slate-800 hover:text-sky-700"
                      >
                        {truncateText(place.name, 42)}
                      </button>
                    </td>

                    <td className="px-3 py-3 text-slate-600" title={place.types.map(formatCategory).join(", ")}>
                      {truncateText(formatCategoryList(place.types), 28)}
                    </td>

                    <td className="px-3 py-3 text-slate-600" title={place.address}>
                      {truncateText(place.address, 52)}
                    </td>

                    <td className="px-3 py-3 text-slate-600">
                      {phoneValue ? truncateText(phoneValue, 22) : <span className="text-slate-400">—</span>}
                    </td>

                    <td className="px-3 py-3">
                      {typeof place.rating === "number" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400">{renderStars(place.rating)}</span>
                          <span className="text-slate-600">
                            {place.rating.toFixed(1)} ({place.userRatingsTotal ?? 0})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-slate-600" title={websiteValue || undefined}>
                      {websiteValue ? (
                        <a
                          href={websiteValue}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="hover:text-sky-700"
                        >
                          {truncateText(websiteValue, 30)}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 hover:border-sky-400 hover:bg-sky-100"
                      >
                        Open
                      </a>
                    </td>

                    <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleCopy(phoneValue)}
                          disabled={!phoneValue}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700"
                        >
                          Copy phone
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCopy(place.name)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700"
                        >
                          Copy name
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {selectedCountInCurrentRows > 0 && (
        <div className="flex items-center justify-between border-t border-sky-100 bg-linear-to-r from-slate-50 to-sky-50 px-4 py-3 text-sm">
          <span className="text-slate-700">{selectedCountInCurrentRows} businesses selected</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-500"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={() => onExportSelected(selectedPlaces)}
              className="rounded-lg border border-sky-600 bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
            >
              Export Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
