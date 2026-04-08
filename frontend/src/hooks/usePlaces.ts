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
const DISCOVERY_KEYWORDS = [
  "restaurant",
  "cafe",
  "store",
  "pharmacy",
  "hospital",
  "school",
  "bank",
  "gym",
  "lodging",
];

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

      let nearbyPlaces: Place[];

      if (trimmedQuery) {
        nearbyPlaces = await getNearbyPlaces(latitude, longitude, trimmedQuery, radius);
      } else {
        const discoveryResults = await Promise.allSettled(
          DISCOVERY_KEYWORDS.map((keyword) =>
            getNearbyPlaces(latitude, longitude, keyword, radius),
          ),
        );

        const mergedPlaces: Place[] = [];
        for (const result of discoveryResults) {
          if (result.status === "fulfilled") {
            mergedPlaces.push(...result.value);
          }
        }

        nearbyPlaces = dedupeByPlaceId(mergedPlaces);
      }

      return enrichPlacesWithDetails(nearbyPlaces);
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
