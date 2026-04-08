"use client";

import { useQuery } from "@tanstack/react-query";

import { getNearbyPlaces } from "@/api/googlePlaces";
import { Place } from "@/types/place";

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
  const trimmedQuery = query.trim() || "restaurant";

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
