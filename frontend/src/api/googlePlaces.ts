import axios from "axios";

import { Place, PlaceDetails } from "@/types/place";
import { loadGoogleMaps } from "@/utils/googleMapsLoader";

export const apiClient = axios.create({
  timeout: 15_000,
});

function toPlace(result: google.maps.places.PlaceResult): Place {
  return {
    id: result.place_id ?? result.name ?? crypto.randomUUID(),
    placeId: result.place_id ?? "",
    name: result.name ?? "Unknown place",
    address: result.vicinity ?? result.formatted_address ?? "Address unavailable",
    rating: result.rating,
    userRatingsTotal: result.user_ratings_total,
    location: {
      lat: result.geometry?.location?.lat() ?? 0,
      lng: result.geometry?.location?.lng() ?? 0,
    },
    types: result.types ?? [],
    openNow: result.opening_hours?.isOpen(),
  };
}

function toPlaceDetails(result: google.maps.places.PlaceResult): PlaceDetails {
  const base = toPlace(result);

  return {
    ...base,
    phoneNumber: result.formatted_phone_number,
    internationalPhoneNumber: result.international_phone_number,
    website: result.website,
    mapsUrl: result.url,
    businessStatus: result.business_status,
    openingHours: result.opening_hours?.weekday_text,
  };
}

async function createPlacesService(
  map?: google.maps.Map,
): Promise<google.maps.places.PlacesService> {
  await loadGoogleMaps();

  if (map) {
    return new google.maps.places.PlacesService(map);
  }

  const container = document.createElement("div");
  return new google.maps.places.PlacesService(container);
}

export async function getNearbyPlaces(
  lat: number,
  lng: number,
  type: string,
  map?: google.maps.Map,
): Promise<Place[]> {
  const service = await createPlacesService(map);

  return new Promise((resolve, reject) => {
    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(lat, lng),
      rankBy: google.maps.places.RankBy.DISTANCE,
      keyword: type,
    };

    service.nearbySearch(request, (results, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
        reject(new Error(`Nearby search failed: ${status}`));
        return;
      }

      resolve(results.map(toPlace).filter((place) => Boolean(place.placeId)));
    });
  });
}

export async function getPlaceDetails(
  placeId: string,
  map?: google.maps.Map,
): Promise<PlaceDetails> {
  const service = await createPlacesService(map);

  return new Promise((resolve, reject) => {
    const request: google.maps.places.PlaceDetailsRequest = {
      placeId,
      fields: [
        "place_id",
        "name",
        "formatted_address",
        "geometry",
        "rating",
        "user_ratings_total",
        "types",
        "formatted_phone_number",
        "international_phone_number",
        "opening_hours",
        "website",
        "url",
        "business_status",
      ],
    };

    service.getDetails(request, (result, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !result) {
        reject(new Error(`Place details failed: ${status}`));
        return;
      }

      resolve(toPlaceDetails(result));
    });
  });
}
