"use client";

import { useQuery } from "@tanstack/react-query";

import { getNearbyPlaces, getPlaceDetails } from "@/api/googlePlaces";
import { getPlaceEnrichment } from "@/api/placeEnrichment";
import { Place, PlaceDetails, PlaceEnrichment } from "@/types/place";

type UsePlacesParams = {
  latitude: number | null;
  longitude: number | null;
  query: string;
  radius: number;
};

type UsePlacesResult = {
  places: Place[];
  isLoading: boolean;
  errorMessage: string | null;
  refetch: () => void;
};

const DETAIL_BATCH_SIZE = 8;
const MAX_ENRICHMENT_CANDIDATES = 150;

type LatLng = { lat: number; lng: number };

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function calculateDistanceMeters(origin: LatLng, destination: LatLng): number {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = toRadians(destination.lat - origin.lat);
  const longitudeDelta = toRadians(destination.lng - origin.lng);
  const startLatitude = toRadians(origin.lat);
  const endLatitude = toRadians(destination.lat);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2) *
      Math.cos(startLatitude) *
      Math.cos(endLatitude);

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(a));
}

function offsetCoordinate(origin: LatLng, distanceMeters: number, bearingDegrees: number): LatLng {
  const earthRadiusMeters = 6_371_000;
  const angularDistance = distanceMeters / earthRadiusMeters;
  const bearing = toRadians(bearingDegrees);

  const latitude1 = toRadians(origin.lat);
  const longitude1 = toRadians(origin.lng);

  const latitude2 = Math.asin(
    Math.sin(latitude1) * Math.cos(angularDistance) +
      Math.cos(latitude1) * Math.sin(angularDistance) * Math.cos(bearing),
  );

  const longitude2 =
    longitude1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude1),
      Math.cos(angularDistance) - Math.sin(latitude1) * Math.sin(latitude2),
    );

  return {
    lat: toDegrees(latitude2),
    lng: toDegrees(longitude2),
  };
}

function buildSearchCenters(origin: LatLng, radiusMeters: number): LatLng[] {
  const ringDistance = Math.max(2_000, Math.min(20_000, radiusMeters * 0.6));
  const bearings = [0, 60, 120, 180, 240, 300];
  return [origin, ...bearings.map((bearing) => offsetCoordinate(origin, ringDistance, bearing))];
}

function dedupeByPlaceId(places: Place[]): Place[] {
  const uniqueById = new Map<string, Place>();
  for (const place of places) {
    if (!place.placeId) {
      continue;
    }
    if (!uniqueById.has(place.placeId)) {
      uniqueById.set(place.placeId, place);
    }
  }
  return Array.from(uniqueById.values());
}

async function collectNearbyPlaces(
  origin: LatLng,
  query: string,
  radiusMeters: number,
): Promise<Place[]> {
  const centers = buildSearchCenters(origin, radiusMeters);
  const searchRadius = Math.max(3_000, Math.min(50_000, Math.round(radiusMeters * 0.7)));

  const settled = await Promise.allSettled(
    centers.map((center) => getNearbyPlaces(center.lat, center.lng, query, searchRadius)),
  );

  const mergedPlaces: Place[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") {
      mergedPlaces.push(...result.value);
    }
  }

  const deduped = dedupeByPlaceId(mergedPlaces);
  deduped.sort((left, right) => {
    const leftDistance = calculateDistanceMeters(origin, left.location);
    const rightDistance = calculateDistanceMeters(origin, right.location);
    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
    return left.name.localeCompare(right.name);
  });

  return deduped;
}

function mergeWithDetails(place: Place, details: PlaceDetails): Place {
  return {
    ...place,
    phoneNumber: details.phoneNumber,
    internationalPhoneNumber: details.internationalPhoneNumber,
    website: details.website,
    mapsUrl: details.mapsUrl,
    businessStatus: details.businessStatus,
    openingHours: details.openingHours,
    openNow: details.openNow ?? place.openNow,
  };
}

async function enrichPlacesWithDetails(places: Place[]): Promise<Place[]> {
  if (places.length === 0) {
    return places;
  }

  const enriched = [...places];

  for (let index = 0; index < places.length; index += DETAIL_BATCH_SIZE) {
    const batch = places.slice(index, index + DETAIL_BATCH_SIZE);
    const settledBatch = await Promise.allSettled(
      batch.map((place) => getPlaceDetails(place.placeId)),
    );

    settledBatch.forEach((result, batchIndex) => {
      if (result.status !== "fulfilled") {
        return;
      }

      const targetIndex = index + batchIndex;
      const existing = enriched[targetIndex];
      if (!existing) {
        return;
      }

      enriched[targetIndex] = mergeWithDetails(existing, result.value);
    });
  }

  return enriched;
}

export function usePlaces({
  latitude,
  longitude,
  query,
  radius,
}: UsePlacesParams): UsePlacesResult {
  const trimmedQuery = query.trim();

  const placesQuery = useQuery({
    queryKey: ["places", latitude, longitude, trimmedQuery, radius],
    enabled: latitude !== null && longitude !== null,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      if (latitude === null || longitude === null) {
        return [];
      }

      const origin = { lat: latitude, lng: longitude };
      const nearbyPlaces = await collectNearbyPlaces(origin, trimmedQuery, radius);
      return enrichPlacesWithDetails(nearbyPlaces.slice(0, MAX_ENRICHMENT_CANDIDATES));
    },
  });

  return {
    places: placesQuery.data ?? [],
    isLoading: placesQuery.isFetching,
    errorMessage: placesQuery.error instanceof Error ? placesQuery.error.message : null,
    refetch: () => {
      void placesQuery.refetch();
    },
  };
}

type UsePlaceDetailsResult = {
  placeDetails: PlaceDetails | null;
  isLoading: boolean;
  errorMessage: string | null;
};

export function usePlaceDetails(placeId: string | null): UsePlaceDetailsResult {
  const detailsQuery = useQuery({
    queryKey: ["place-details", placeId],
    enabled: Boolean(placeId),
    queryFn: async () => {
      if (!placeId) {
        return null;
      }

      return getPlaceDetails(placeId);
    },
  });

  return {
    placeDetails: detailsQuery.data ?? null,
    isLoading: detailsQuery.isFetching,
    errorMessage: detailsQuery.error instanceof Error ? detailsQuery.error.message : null,
  };
}

type UsePlaceEnrichmentResult = {
  enrichment: PlaceEnrichment | null;
  isLoading: boolean;
  errorMessage: string | null;
};

export function usePlaceEnrichment(website?: string): UsePlaceEnrichmentResult {
  const enrichmentQuery = useQuery({
    queryKey: ["place-enrichment", website],
    enabled: Boolean(website),
    queryFn: async () => {
      return getPlaceEnrichment(website);
    },
  });

  return {
    enrichment: enrichmentQuery.data ?? null,
    isLoading: enrichmentQuery.isFetching,
    errorMessage: enrichmentQuery.error instanceof Error ? enrichmentQuery.error.message : null,
  };
}
