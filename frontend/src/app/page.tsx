
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ActiveFilterChips from "@/components/ui/ActiveFilterChips";
import ExportModal from "@/components/ui/ExportModal";
import FiltersSidebar from "@/components/ui/FiltersSidebar";
import Map from "@/components/ui/Map";
import ResultsTable from "@/components/ui/ResultsTable";
import SearchBar from "@/components/ui/SearchBar";
import Toast from "@/components/ui/Toast";
import { geocodeLocation } from "@/api/googlePlaces";
import { useExport } from "@/hooks/useExport";
import { useFilters } from "@/hooks/useFilters";
import { usePlaces } from "@/hooks/usePlaces";
import { DEFAULT_FILTERS } from "@/types/filters";
import { Place } from "@/types/place";

type GeolocationState = {
  lat: number;
  lng: number;
};

type UiToastState = {
  message: string;
  type: "success" | "error";
};

const ITEMS_PER_PAGE = 100;
const FETCH_RADIUS_METERS = 100_000;

type PlaceWithDistance = Place & {
  distanceMeters?: number;
};

function calculateDistanceMeters(
  origin: GeolocationState,
  destination: { lat: number; lng: number },
): number {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = ((destination.lat - origin.lat) * Math.PI) / 180;
  const longitudeDelta = ((destination.lng - origin.lng) * Math.PI) / 180;
  const startLatitude = (origin.lat * Math.PI) / 180;
  const endLatitude = (destination.lat * Math.PI) / 180;

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2) *
      Math.cos(startLatitude) *
      Math.cos(endLatitude);

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(a));
}

export default function Home() {
  const [location, setLocation] = useState<GeolocationState | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState("Current location");
  const [locationQuery, setLocationQuery] = useState("");
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [uiToast, setUiToast] = useState<UiToastState | null>(null);

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
        setLocationLabel("Current location");
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

  const { places, isLoading, errorMessage } = usePlaces({
    latitude: location?.lat ?? null,
    longitude: location?.lng ?? null,
    query: searchQuery,
    radius: FETCH_RADIUS_METERS,
  });

  const placesWithDistance = useMemo((): PlaceWithDistance[] => {
    if (!location) {
      return places;
    }

    return places.map((place) => ({
      ...place,
      distanceMeters: calculateDistanceMeters(location, place.location),
    }));
  }, [location, places]);

  const filteredPlaces = useMemo(() => applyFilters(placesWithDistance), [applyFilters, placesWithDistance]);

  const sortedPlaces = useMemo(() => {
    return [...filteredPlaces].sort((left, right) => {
      const leftDistance = left.distanceMeters ?? Number.POSITIVE_INFINITY;
      const rightDistance = right.distanceMeters ?? Number.POSITIVE_INFINITY;

      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      return left.name.localeCompare(right.name);
    });
  }, [filteredPlaces]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedPlaces.length / ITEMS_PER_PAGE));
  }, [sortedPlaces.length]);

  const clampedPage = Math.min(currentPage, totalPages);

  const paginatedPlaces = useMemo(() => {
    const start = (clampedPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return sortedPlaces.slice(start, end);
  }, [clampedPage, sortedPlaces]);

  const {
    isModalOpen,
    exportMode,
    exportCount,
    placesToExport,
    selectedFields,
    exportFormat,
    fileName,
    isExporting,
    showSuccess,
    openModalForSelected,
    openModalForAll,
    closeModal,
    toggleField,
    selectAllFields,
    deselectAllFields,
    setFormat,
    setFileName,
    triggerExport,
    toast,
    clearToast,
  } = useExport(placesWithDistance, sortedPlaces);

  const displayedToast = toast ?? uiToast;

  useEffect(() => {
    if (!displayedToast) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (toast) {
        clearToast();
      }
      setUiToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [clearToast, displayedToast, toast]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setSelectedPlaceId(null);
    setCurrentPage(1);
  }, []);

  const handleLocationApply = useCallback(async () => {
    const trimmedLocation = locationQuery.trim();
    if (!trimmedLocation) {
      setUiToast({ message: "✗ Enter a city, state, or country first", type: "error" });
      return;
    }

    setIsResolvingLocation(true);
    try {
      const resolvedLocation = await geocodeLocation(trimmedLocation);
      setLocation({ lat: resolvedLocation.lat, lng: resolvedLocation.lng });
      setLocationLabel(resolvedLocation.label);
      setSelectedPlaceId(null);
      setCurrentPage(1);
      setUiToast({ message: `✓ Location changed to ${resolvedLocation.label}`, type: "success" });
    } catch (error) {
      setUiToast({
        message: error instanceof Error ? error.message : "✗ Could not change location",
        type: "error",
      });
    } finally {
      setIsResolvingLocation(false);
    }
  }, [locationQuery]);

  const handlePlaceSelect = useCallback((place: Place) => {
    setSelectedPlaceId(place.placeId);
  }, []);

  const selectedPlaceInList = useMemo(() => {
    if (!selectedPlaceId) {
      return null;
    }

    return sortedPlaces.find((place) => place.placeId === selectedPlaceId) ?? null;
  }, [selectedPlaceId, sortedPlaces]);

  const handleRadiusChange = useCallback((meters: number) => {
    setRadius(meters);
    setCurrentPage(1);
  }, [setRadius]);

  const handleResetFilters = useCallback(() => {
    resetFilters();
    setUiToast({ message: "✓ Filters reset", type: "success" });
  }, [resetFilters]);

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

    if (filters.radius !== DEFAULT_FILTERS.radius) {
      chips.push({
        key: "radius",
        label: `Radius: ${Math.round(filters.radius / 1000)} km`,
        onRemove: () => handleRadiusChange(DEFAULT_FILTERS.radius),
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
      return searchQuery ? `Searching for ${searchQuery} nearby...` : "Searching nearby places...";
    }
    return searchQuery
      ? `${sortedPlaces.length} places found for "${searchQuery}"`
      : `${sortedPlaces.length} places found nearby`;
  }, [errorMessage, isLoading, location, locationError, searchQuery, sortedPlaces.length]);

  const kpiCards = useMemo(() => {
    const total = sortedPlaces.length;
    const openNowCount = sortedPlaces.filter((place) => place.openNow).length;
    const rated = sortedPlaces.filter((place) => typeof place.rating === "number");
    const avgRating =
      rated.length > 0
        ? (rated.reduce((sum, place) => sum + (place.rating ?? 0), 0) / rated.length).toFixed(1)
        : "0.0";

    return [
      { label: "Results", value: total.toString() },
      { label: "Open Now", value: openNowCount.toString() },
      { label: "Avg Rating", value: avgRating },
    ];
  }, [sortedPlaces]);

  return (
    <main className="flex h-screen w-screen flex-col bg-slate-100 text-slate-800">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black uppercase tracking-[0.12em] text-red-500">LocalMiner</h1>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {listHeader} · {locationLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {kpiCards.map((card) => (
              <div key={card.label} className="border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="text-sm font-bold text-slate-800">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex flex-1 gap-2">
            <div className="flex-1">
              <SearchBar defaultValue="" onSearch={handleSearch} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                placeholder="Change location"
                className="h-12 w-48 border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => {
                  void handleLocationApply();
                }}
                disabled={isResolvingLocation}
                className="border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-red-400 hover:text-red-600 disabled:opacity-50"
              >
                {isResolvingLocation ? "Changing..." : "Change Location"}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsMapVisible((prev) => {
                  const next = !prev;
                  setUiToast({
                    message: next ? "✓ Map shown" : "✓ Map hidden",
                    type: "success",
                  });
                  return next;
                });
              }}
              className="border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-red-400 hover:text-red-600"
            >
              {isMapVisible ? "Hide Map" : "Show Map"}
            </button>
            <button
              type="button"
              onClick={openModalForAll}
              disabled={sortedPlaces.length === 0}
              className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:border-red-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>⬇</span>
              <span>Export All ({sortedPlaces.length})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="hidden px-5 pt-4 lg:block">
        <FiltersSidebar
          filters={filters}
          allPlaces={placesWithDistance}
          resultCount={sortedPlaces.length}
          setMinRating={setMinRating}
          toggleOpenNow={toggleOpenNow}
          toggleHasPhone={toggleHasPhone}
          toggleHasWebsite={toggleHasWebsite}
          onRadiusChange={handleRadiusChange}
          toggleCategory={toggleCategory}
          resetFilters={handleResetFilters}
          isAnyFilterActive={isAnyFilterActive}
        />
      </div>

      <div className="min-h-0 flex-1 gap-4 p-5 pt-4 lg:flex">
        <section className="min-h-0 flex-1 space-y-3">
          <ActiveFilterChips chips={activeFilterChips} onClearAll={handleResetFilters} />
          <ResultsTable
            places={paginatedPlaces}
            isLoading={isLoading}
            selectedPlaceId={selectedPlaceInList?.placeId ?? null}
            onSelectPlace={handlePlaceSelect}
            onExportSelected={openModalForSelected}
          />

          {!isLoading && filteredPlaces.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3 text-sm">
              <p className="text-slate-600">
                Showing {(clampedPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(clampedPage * ITEMS_PER_PAGE, filteredPlaces.length)} of {filteredPlaces.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={clampedPage === 1}
                  className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-xs font-semibold text-slate-600">
                  Page {clampedPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={clampedPage === totalPages}
                  className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {isMapVisible && (
          <aside className="mt-4 h-[40vh] border border-slate-200 bg-white shadow-sm lg:mt-0 lg:h-full lg:w-[38%]">
            <Map
              places={paginatedPlaces}
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
        className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-lg md:hidden"
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
          <div className="h-full w-[88%] max-w-sm border-l border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-black uppercase tracking-wide text-slate-800">Filters</p>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(100%-49px)] p-3">
              <FiltersSidebar
                filters={filters}
                allPlaces={placesWithDistance}
                resultCount={sortedPlaces.length}
                setMinRating={setMinRating}
                toggleOpenNow={toggleOpenNow}
                toggleHasPhone={toggleHasPhone}
                toggleHasWebsite={toggleHasWebsite}
                onRadiusChange={handleRadiusChange}
                toggleCategory={toggleCategory}
                resetFilters={handleResetFilters}
                isAnyFilterActive={isAnyFilterActive}
              />
            </div>
          </div>
        </div>
      )}

      <ExportModal
        isOpen={isModalOpen}
        exportMode={exportMode}
        exportCount={exportCount}
        placesToExport={placesToExport}
        selectedFields={selectedFields}
        exportFormat={exportFormat}
        fileName={fileName}
        isExporting={isExporting}
        showSuccess={showSuccess}
        onClose={closeModal}
        onToggleField={toggleField}
        onSelectAllFields={selectAllFields}
        onDeselectAllFields={deselectAllFields}
        onFormatChange={setFormat}
        onFileNameChange={setFileName}
        onExport={() => {
          void triggerExport();
        }}
      />

      {displayedToast && <Toast message={displayedToast.message} type={displayedToast.type} />}
    </main>
  );
}
