"use client";

import { Place } from "@/types/place";

type PlaceCardProps = {
  place: Place;
  isSelected: boolean;
  onClick: (place: Place) => void;
};

export default function PlaceCard({ place, isSelected, onClick }: PlaceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(place)}
      className={[
        "w-full border p-4 text-left transition-colors",
        isSelected
          ? "border-red-600 bg-red-50"
          : "border-zinc-300 bg-white hover:border-zinc-500",
      ].join(" ")}
    >
      <h3 className="text-base font-semibold uppercase tracking-wide text-zinc-900">{place.name}</h3>
      <p className="mt-2 text-sm text-zinc-700">{place.address}</p>
      <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-zinc-800">
        <span>Rating: {typeof place.rating === "number" ? place.rating.toFixed(1) : "N/A"}</span>
        <span>Reviews: {place.userRatingsTotal ?? 0}</span>
      </div>
    </button>
  );
}
