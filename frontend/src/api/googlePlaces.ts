import axios from "axios";

import { Place, PlaceDetails } from "@/types/place";
import { loadGoogleMaps } from "@/utils/googleMapsLoader";

export const apiClient = axios.create({
  timeout: 15_000,
});

const SEARCH_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "types",
  "currentOpeningHours",
] as const;

const DETAIL_FIELDS = [
  ...SEARCH_FIELDS,
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteURI",
  "googleMapsURI",
  "businessStatus",
  "regularOpeningHours",
] as const;

type SearchByTextResponse = {
  places?: google.maps.places.Place[];
  nextPageToken?: string;
};

type SearchNearbyResponse = {
  places?: google.maps.places.Place[];
};

function resolveCoordinate(value: number | (() => number)): number {
  return typeof value === "function" ? value() : value;
}

function readPlaceLocation(place: google.maps.places.Place): { lat: number; lng: number } {
  const location = place.location;
  if (!location) {
    return { lat: 0, lng: 0 };
  }

  return {
    lat: resolveCoordinate(location.lat),
    lng: resolveCoordinate(location.lng),
  };
}

function readDisplayName(place: google.maps.places.Place): string {
  const value = place.displayName;
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "text" in value) {
    const text = (value as { text?: string }).text;
    if (text) {
      return text;
    }
  }

  return "Unknown place";
}

function toPlace(result: google.maps.places.Place): Place {
  const currentOpeningHours = (
    result as unknown as { currentOpeningHours?: { openNow?: boolean | null } }
  ).currentOpeningHours;

  return {
    id: result.id ?? readDisplayName(result) ?? crypto.randomUUID(),
    placeId: result.id ?? "",
    name: readDisplayName(result),
    address: result.formattedAddress ?? "Address unavailable",
    rating: result.rating ?? undefined,
    userRatingsTotal: result.userRatingCount ?? undefined,
    location: readPlaceLocation(result),
    types: result.types ?? [],
    openNow: currentOpeningHours?.openNow ?? undefined,
  };
}

function toPlaceDetails(result: google.maps.places.Place): PlaceDetails {
  const base = toPlace(result);
  const details = result as unknown as {
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteURI?: string;
    googleMapsURI?: string;
    businessStatus?: string;
    regularOpeningHours?: { weekdayDescriptions?: string[] };
  };

  return {
    ...base,
    phoneNumber: details.nationalPhoneNumber,
    internationalPhoneNumber: details.internationalPhoneNumber,
    website: details.websiteURI,
    mapsUrl: details.googleMapsURI,
    businessStatus: details.businessStatus,
    openingHours: details.regularOpeningHours?.weekdayDescriptions,
  };
}

function dedupePlaces(places: Place[]): Place[] {
  const seen = new Set<string>();
  const uniquePlaces: Place[] = [];

  for (const place of places) {
    if (seen.has(place.placeId)) {
      continue;
    }

    seen.add(place.placeId);
    uniquePlaces.push(place);
  }

  return uniquePlaces;
}

async function createPlacesService(
): Promise<typeof google.maps.places.Place> {
  await loadGoogleMaps();
  return google.maps.places.Place;
}

export async function getNearbyPlaces(
  lat: number,
  lng: number,
  query: string,
  radius = 20_000,
  _map?: google.maps.Map,
): Promise<Place[]> {
  const PlaceClass = await createPlacesService();
  const normalizedQuery = query.trim();
  const center = { lat, lng };

  if (!normalizedQuery) {
    const searchNearby = (
      PlaceClass as unknown as {
        searchNearby: (request: Record<string, unknown>) => Promise<SearchNearbyResponse>;
      }
    ).searchNearby;

    if (typeof searchNearby !== "function") {
      throw new Error("Place.searchNearby is unavailable in this Maps JavaScript API version.");
    }

    const nearbyResponse = await searchNearby({
      fields: [...SEARCH_FIELDS],
      maxResultCount: 20,
      locationRestriction: {
        center,
        radius,
      },
    });

    return dedupePlaces(
      (nearbyResponse.places ?? []).map(toPlace).filter((place) => Boolean(place.placeId)),
    );
  }

  const searchByText = (
    PlaceClass as unknown as {
      searchByText: (request: Record<string, unknown>) => Promise<SearchByTextResponse>;
    }
  ).searchByText;

  if (typeof searchByText !== "function") {
    throw new Error("Place.searchByText is unavailable in this Maps JavaScript API version.");
  }

  const allResults: Place[] = [];
  let pageToken: string | undefined;

  do {
    const request: Record<string, unknown> = {
      textQuery: normalizedQuery,
      fields: [...SEARCH_FIELDS],
      maxResultCount: 20,
      locationRestriction: {
        center,
        radius,
      },
    };

    if (pageToken) {
      request.pageToken = pageToken;
    }

    const response = await searchByText(request);
    const places = response.places ?? [];
    allResults.push(...places.map(toPlace).filter((place) => Boolean(place.placeId)));
    pageToken = response.nextPageToken;

    if (pageToken) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 2000);
      });
    }
  } while (pageToken);

  return dedupePlaces(allResults);
}

export async function geocodeLocation(query: string): Promise<{ lat: number; lng: number; label: string }> {
  await loadGoogleMaps();

  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== google.maps.GeocoderStatus.OK || !results || results.length === 0) {
        reject(new Error(`Location not found: ${status}`));
        return;
      }

      const firstResult = results[0];
      resolve({
        lat: firstResult.geometry.location.lat(),
        lng: firstResult.geometry.location.lng(),
        label: firstResult.formatted_address ?? query,
      });
    });
  });
}

export async function getPlaceDetails(
  placeId: string,
  _map?: google.maps.Map,
): Promise<PlaceDetails> {
  const PlaceClass = await createPlacesService();
  const place = new PlaceClass({ id: placeId });

  const fetchFields = (
    place as unknown as {
      fetchFields: (request: { fields: string[] }) => Promise<unknown>;
    }
  ).fetchFields;

  if (typeof fetchFields !== "function") {
    throw new Error("Place.fetchFields is unavailable in this Maps JavaScript API version.");
  }

  await fetchFields({ fields: [...DETAIL_FIELDS] });
  return toPlaceDetails(place);
}
