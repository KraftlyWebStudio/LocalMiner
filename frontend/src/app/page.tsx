
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Map from "@/components/ui/Map";
import ResultsTable from "@/components/ui/ResultsTable";
import SearchBar from "@/components/ui/SearchBar";
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

  const { places, isLoading, errorMessage } = usePlaces({
    latitude: location?.lat ?? null,
    longitude: location?.lng ?? null,
    query: searchQuery,
  });

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

    return places.find((place) => place.placeId === selectedPlaceId) ?? null;
  }, [places, selectedPlaceId]);

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
    return `${places.length} places found for \"${searchQuery}\"`;
  }, [errorMessage, isLoading, location, locationError, places.length, searchQuery]);

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
        <section className="min-h-0 flex-1">
          <ResultsTable
            places={places}
            isLoading={isLoading}
            selectedPlaceId={selectedPlaceInList?.placeId ?? null}
            onSelectPlace={handlePlaceSelect}
            onExportSelected={() => {}}
          />
        </section>

        {isMapVisible && (
          <aside className="mt-4 h-[40vh] border border-zinc-800 bg-zinc-900 lg:mt-0 lg:h-full lg:w-[38%]">
            <Map
              places={places}
              center={location}
              selectedPlaceId={selectedPlaceInList?.placeId ?? null}
              onSelectPlace={handlePlaceSelect}
            />
          </aside>
        )}
      </div>
    </main>
  );
}
