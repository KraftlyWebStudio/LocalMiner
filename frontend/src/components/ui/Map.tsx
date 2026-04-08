"use client";

import { useEffect, useMemo, useRef } from "react";

import { Place } from "@/types/place";
import { loadGoogleMaps } from "@/utils/googleMapsLoader";

type MapProps = {
  places: Place[];
  center: { lat: number; lng: number } | null;
  selectedPlaceId: string | null;
  onSelectPlace: (place: Place) => void;
};

type MarkerHandle = {
  marker: google.maps.Marker | google.maps.marker.AdvancedMarkerElement;
  dispose: () => void;
};

export default function Map({
  places,
  center,
  selectedPlaceId,
  onSelectPlace,
}: MapProps) {
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim();
  const canUseAdvancedMarkers = Boolean(mapId);

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<Map<string, MarkerHandle>>(
    new globalThis.Map(),
  );

  const placeById = useMemo(() => {
    return new globalThis.Map(places.map((place) => [place.placeId, place]));
  }, [places]);

  useEffect(() => {
    if (!mapElementRef.current || !center) {
      return;
    }

    let cancelled = false;

    async function initializeMap() {
      await loadGoogleMaps();
      if (cancelled || !mapElementRef.current || mapRef.current) {
        return;
      }

      mapRef.current = new google.maps.Map(mapElementRef.current, {
        center,
        zoom: 15,
        mapId: mapId || undefined,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      infoWindowRef.current = new google.maps.InfoWindow();
    }

    void initializeMap();

    return () => {
      cancelled = true;
    };
  }, [center, mapId]);

  useEffect(() => {
    if (!mapRef.current || !center) {
      return;
    }

    mapRef.current.panTo(center);
  }, [center]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const currentMarkerIds = new Set(markersRef.current.keys());

    for (const place of places) {
      currentMarkerIds.delete(place.placeId);
      if (markersRef.current.has(place.placeId)) {
        continue;
      }

      const openInfoWindow = (
        marker: google.maps.Marker | google.maps.marker.AdvancedMarkerElement,
      ) => {
        onSelectPlace(place);
        if (!infoWindowRef.current) {
          return;
        }

        infoWindowRef.current.setContent(
          `<div style="font-family: sans-serif; padding: 4px;">
            <strong>${place.name}</strong><br />
            <span>${place.address}</span>
          </div>`,
        );
        infoWindowRef.current.open({ anchor: marker, map: mapRef.current });
      };

      if (canUseAdvancedMarkers) {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position: place.location,
          title: place.name,
        });

        const clickHandler = () => openInfoWindow(marker);

        marker.addEventListener("gmp-click", clickHandler);
        markersRef.current.set(place.placeId, {
          marker,
          dispose: () => marker.removeEventListener("gmp-click", clickHandler),
        });
      } else {
        const marker = new google.maps.Marker({
          map: mapRef.current,
          position: place.location,
          title: place.name,
        });

        const clickHandler = () => openInfoWindow(marker);

        const listener = marker.addListener("click", clickHandler);
        markersRef.current.set(place.placeId, {
          marker,
          dispose: () => listener.remove(),
        });
      }
    }

    for (const staleMarkerId of currentMarkerIds) {
      const markerHandle = markersRef.current.get(staleMarkerId);
      if (markerHandle) {
        markerHandle.dispose();
        if (markerHandle.marker instanceof google.maps.Marker) {
          markerHandle.marker.setMap(null);
        } else {
          markerHandle.marker.map = null;
        }
      }
      markersRef.current.delete(staleMarkerId);
    }
  }, [canUseAdvancedMarkers, onSelectPlace, places]);

  useEffect(() => {
    if (!selectedPlaceId || !mapRef.current) {
      return;
    }

    const selectedPlace = placeById.get(selectedPlaceId);
    const selectedMarkerHandle = markersRef.current.get(selectedPlaceId);

    if (!selectedPlace || !selectedMarkerHandle) {
      return;
    }

    mapRef.current.panTo(selectedPlace.location);
    mapRef.current.setZoom(16);

    if (infoWindowRef.current) {
      infoWindowRef.current.setContent(
        `<div style="font-family: sans-serif; padding: 4px;">
          <strong>${selectedPlace.name}</strong><br />
          <span>${selectedPlace.address}</span>
        </div>`,
      );
      infoWindowRef.current.open({ anchor: selectedMarkerHandle.marker, map: mapRef.current });
    }
  }, [placeById, selectedPlaceId]);

  return <div ref={mapElementRef} className="h-full w-full border border-zinc-300 bg-zinc-100" />;
}
