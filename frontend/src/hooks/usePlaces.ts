"use client";

import { useQuery } from "@tanstack/react-query";

import { getNearbyPlaces, getPlaceDetails } from "@/api/googlePlaces";
import { getPlaceEnrichment } from "@/api/placeEnrichment";
import { Place, PlaceDetails, PlaceEnrichment } from "@/types/place";

type UsePlacesParams = {
  latitude: number | null;
  longitude: number | null;
  query: string;
};

type UsePlacesResult = {
  places: Place[];
  isLoading: boolean;
  errorMessage: string | null;
  refetch: () => void;
};

export function usePlaces({
  latitude,
  longitude,
  query,
}: UsePlacesParams): UsePlacesResult {
  const trimmedQuery = query.trim() || "establishment";

  const placesQuery = useQuery({
    queryKey: ["places", latitude, longitude, trimmedQuery],
    enabled: latitude !== null && longitude !== null,
    queryFn: async () => {
      if (latitude === null || longitude === null) {
        return [];
      }

      return getNearbyPlaces(latitude, longitude, trimmedQuery);
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
