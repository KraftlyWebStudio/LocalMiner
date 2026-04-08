
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ActiveFilterChips from "@/components/ui/ActiveFilterChips";
import FiltersSidebar from "@/components/ui/FiltersSidebar";
import Map from "@/components/ui/Map";
import ResultsTable from "@/components/ui/ResultsTable";
import SearchBar from "@/components/ui/SearchBar";
import { useFilters } from "@/hooks/useFilters";
import { usePlaces } from "@/hooks/usePlaces";
import { Place } from "@/types/place";

type GeolocationState = {
  lat: number;
  lng: number;
};

export default function Home() {
  const [location, setLocation] = useState<GeolocationState | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("restaurant");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      // Keep the state update asynchronous to satisfy React Compiler lint rules.
      window.setTimeout(() => {
        setLocationError("Geolocation is not supported by this browser.");
      }, 0);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      },
      () => {
        setLocationError(
          "Unable to retrieve your location. Please allow location access and refresh.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
      },
    );
  }, []);

  const { places, isLoading, errorMessage, refetch } = usePlaces({
    latitude: location?.lat ?? null,
    longitude: location?.lng ?? null,
    query: searchQuery,
  });

  const {
    filters,
    setMinRating,
    toggleOpenNow,
    toggleHasPhone,
    toggleHasWebsite,
    setRadius,
    toggleCategory,
    resetFilters,
    isAnyFilterActive,
    activeFilterCount,
    applyFilters,
  } = useFilters();

  const filteredPlaces = useMemo(() => applyFilters(places), [applyFilters, places]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setSelectedPlaceId(null);
  }, []);

  const handlePlaceSelect = useCallback((place: Place) => {
    setSelectedPlaceId(place.placeId);
  }, []);

  const selectedPlaceInList = useMemo(() => {
    if (!selectedPlaceId) {
      return null;
    }

    return filteredPlaces.find((place) => place.placeId === selectedPlaceId) ?? null;
  }, [filteredPlaces, selectedPlaceId]);

  const handleRadiusChange = useCallback(
    (meters: number) => {
      setRadius(meters);
      refetch();
    },
    [refetch, setRadius],
  );

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (filters.minRating !== null) {
      chips.push({
        key: "min-rating",
        label: `Rating: ${filters.minRating}★+`,
        onRemove: () => setMinRating(null),
      });
    }

    if (filters.openNow) {
      chips.push({ key: "open-now", label: "Open Now", onRemove: toggleOpenNow });
    }

    if (filters.hasPhone) {
      chips.push({ key: "has-phone", label: "Has Phone", onRemove: toggleHasPhone });
    }

    if (filters.hasWebsite) {
      chips.push({ key: "has-website", label: "Has Website", onRemove: toggleHasWebsite });
    }

    if (filters.radius !== 5000) {
      chips.push({
        key: "radius",
        label: `Radius: ${Math.round(filters.radius / 1000)} km`,
        onRemove: () => handleRadiusChange(5000),
      });
    }

    for (const category of filters.categories) {
      const formattedCategory = category
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
      chips.push({
        key: `category-${category}`,
        label: `Category: ${formattedCategory}`,
        onRemove: () => toggleCategory(category),
      });
    }

    return chips;
  }, [
    filters.categories,
    filters.hasPhone,
    filters.hasWebsite,
    filters.minRating,
    filters.openNow,
    filters.radius,
    handleRadiusChange,
    setMinRating,
    toggleCategory,
    toggleHasPhone,
    toggleHasWebsite,
    toggleOpenNow,
  ]);

  const listHeader = useMemo(() => {
    if (locationError) {
      return locationError;
    }
    if (errorMessage) {
      return errorMessage;
    }
    if (!location) {
      return "Getting your location...";
    }
    if (isLoading) {
      return `Searching for ${searchQuery} nearby...`;
    }
    return `${filteredPlaces.length} places found for \"${searchQuery}\"`;
  }, [errorMessage, filteredPlaces.length, isLoading, location, locationError, searchQuery]);

  return (
    <main className="flex h-screen w-screen flex-col bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black uppercase tracking-[0.1em] text-red-500">LocalMiner</h1>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{listHeader}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsMapVisible((prev) => !prev)}
          className="border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-red-500 hover:text-red-300"
        >
          {isMapVisible ? "Hide Map" : "Show Map"}
        </button>
      </div>

      <div className="border-b border-zinc-800 px-4 py-3">
        <SearchBar defaultValue="restaurant" onSearch={handleSearch} />
      </div>

      <div className="min-h-0 flex-1 gap-4 p-4 lg:flex">
        <aside className="hidden min-h-0 lg:block lg:w-[290px]">
          <FiltersSidebar
            filters={filters}
            allPlaces={places}
            resultCount={filteredPlaces.length}
            setMinRating={setMinRating}
            toggleOpenNow={toggleOpenNow}
            toggleHasPhone={toggleHasPhone}
            toggleHasWebsite={toggleHasWebsite}
            onRadiusChange={handleRadiusChange}
            toggleCategory={toggleCategory}
            resetFilters={resetFilters}
            isAnyFilterActive={isAnyFilterActive}
          />
        </aside>

        <section className="min-h-0 flex-1 space-y-3">
          <ActiveFilterChips chips={activeFilterChips} />
          <ResultsTable
            places={filteredPlaces}
            isLoading={isLoading}
            selectedPlaceId={selectedPlaceInList?.placeId ?? null}
            onSelectPlace={handlePlaceSelect}
            onExportSelected={() => {}}
          />
        </section>

        {isMapVisible && (
          <aside className="mt-4 h-[40vh] border border-zinc-800 bg-zinc-900 lg:mt-0 lg:h-full lg:w-[38%]">
            <Map
              places={filteredPlaces}
              center={location}
              selectedPlaceId={selectedPlaceInList?.placeId ?? null}
              onSelectPlace={handlePlaceSelect}
            />
          </aside>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsMobileFiltersOpen(true)}
        className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-100 shadow-lg md:hidden"
      >
        <span>⚙ Filters</span>
        {isAnyFilterActive && (
          <span className="inline-flex min-w-5 items-center justify-center border border-red-500 bg-red-600 px-1.5 text-xs text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setIsMobileFiltersOpen(false)}
            className="h-full flex-1 bg-black/60"
          />
          <div className="h-full w-[88%] max-w-sm border-l border-zinc-800 bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <p className="text-sm font-black uppercase tracking-wide text-zinc-100">Filters</p>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="border border-zinc-700 px-2 py-1 text-xs font-semibold text-zinc-200"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(100%-49px)] p-3">
              <FiltersSidebar
                filters={filters}
                allPlaces={places}
                resultCount={filteredPlaces.length}
                setMinRating={setMinRating}
                toggleOpenNow={toggleOpenNow}
                toggleHasPhone={toggleHasPhone}
                toggleHasWebsite={toggleHasWebsite}
                onRadiusChange={handleRadiusChange}
                toggleCategory={toggleCategory}
                resetFilters={resetFilters}
                isAnyFilterActive={isAnyFilterActive}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
