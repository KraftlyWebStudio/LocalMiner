
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import MainLayout from "@/components/layouts/MainLayout";
import Map from "@/components/ui/Map";
import PlaceCard from "@/components/ui/PlaceCard";
import SearchBar from "@/components/ui/SearchBar";
import { usePlaceDetails, usePlaceEnrichment, usePlaces } from "@/hooks/usePlaces";
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

  const {
    placeDetails: selectedPlaceDetails,
    isLoading: isPlaceDetailsLoading,
    errorMessage: placeDetailsError,
  } = usePlaceDetails(selectedPlaceInList?.placeId ?? null);

  const {
    enrichment: selectedPlaceEnrichment,
    isLoading: isEnrichmentLoading,
    errorMessage: enrichmentError,
  } = usePlaceEnrichment(selectedPlaceDetails?.website);

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
    <MainLayout
      left={
        <div className="flex h-full flex-col gap-4 p-4">
          <header className="space-y-3 border border-zinc-300 bg-white p-4">
            <h1 className="text-2xl font-black uppercase tracking-[0.1em] text-red-700">LocalMiner</h1>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">{listHeader}</p>
            <SearchBar defaultValue="restaurant" onSearch={handleSearch} />
          </header>

          {selectedPlaceInList && (
            <section className="space-y-3 border border-zinc-300 bg-white p-4">
              <h2 className="text-sm font-black uppercase tracking-[0.08em] text-red-700">
                Place Details
              </h2>
              <p className="text-base font-semibold text-zinc-900">{selectedPlaceInList.name}</p>

              {isPlaceDetailsLoading && (
                <p className="text-sm font-medium text-zinc-700">Loading full details...</p>
              )}

              {isEnrichmentLoading && (
                <p className="text-sm font-medium text-zinc-700">Scanning website for contact links...</p>
              )}

              {placeDetailsError && (
                <p className="text-sm font-medium text-red-700">{placeDetailsError}</p>
              )}

              {enrichmentError && (
                <p className="text-sm font-medium text-red-700">{enrichmentError}</p>
              )}

              {selectedPlaceDetails && (
                <div className="space-y-2 text-sm text-zinc-800">
                  <p>
                    <span className="font-semibold">Phone:</span>{" "}
                    {selectedPlaceDetails.phoneNumber ? (
                      <a
                        href={`tel:${selectedPlaceDetails.phoneNumber}`}
                        className="text-red-700 hover:underline"
                      >
                        {selectedPlaceDetails.phoneNumber}
                      </a>
                    ) : (
                      "Not available"
                    )}
                  </p>

                  <p>
                    <span className="font-semibold">Website:</span>{" "}
                    {selectedPlaceDetails.website ? (
                      <a
                        href={selectedPlaceDetails.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-700 hover:underline"
                      >
                        Open website
                      </a>
                    ) : (
                      "Not available"
                    )}
                  </p>

                  <p>
                    <span className="font-semibold">Google Maps:</span>{" "}
                    {selectedPlaceDetails.mapsUrl ? (
                      <a
                        href={selectedPlaceDetails.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-700 hover:underline"
                      >
                        Open listing
                      </a>
                    ) : (
                      "Not available"
                    )}
                  </p>

                  <p>
                    <span className="font-semibold">Business Status:</span>{" "}
                    {selectedPlaceDetails.businessStatus ?? "Not available"}
                  </p>

                  <p>
                    <span className="font-semibold">Email:</span>{" "}
                    {selectedPlaceEnrichment?.email ? (
                      <a
                        href={`mailto:${selectedPlaceEnrichment.email}`}
                        className="text-red-700 hover:underline"
                      >
                        {selectedPlaceEnrichment.email}
                      </a>
                    ) : (
                      "Not found on website"
                    )}
                  </p>

                  <div>
                    <p className="font-semibold">Social Media:</p>
                    {selectedPlaceEnrichment?.socialProfiles &&
                    Object.keys(selectedPlaceEnrichment.socialProfiles).length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {Object.entries(selectedPlaceEnrichment.socialProfiles).map(
                          ([network, link]) => (
                            <li key={network}>
                              <span className="font-medium uppercase">{network}:</span>{" "}
                              <a
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-red-700 hover:underline"
                              >
                                Open profile
                              </a>
                            </li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm">Not found on website</p>
                    )}
                  </div>

                  {selectedPlaceDetails.openingHours && selectedPlaceDetails.openingHours.length > 0 && (
                    <div>
                      <p className="font-semibold">Opening Hours:</p>
                      <ul className="mt-1 space-y-1">
                        {selectedPlaceDetails.openingHours.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          <div className="grid flex-1 auto-rows-min gap-3 overflow-y-auto pr-1">
            {places.map((place) => (
              <PlaceCard
                key={place.placeId}
                place={place}
                isSelected={selectedPlaceInList?.placeId === place.placeId}
                onClick={handlePlaceSelect}
              />
            ))}

            {!isLoading && places.length === 0 && !locationError && (
              <div className="border border-zinc-300 bg-white p-4 text-sm font-medium text-zinc-700">
                No places found for this search. Try a different keyword like bakery or pharmacy.
              </div>
            )}
          </div>
        </div>
      }
      right={
        <div className="h-full w-full p-4">
          <Map
            places={places}
            center={location}
            selectedPlaceId={selectedPlaceInList?.placeId ?? null}
            onSelectPlace={handlePlaceSelect}
          />
        </div>
      }
    />
  );
}
