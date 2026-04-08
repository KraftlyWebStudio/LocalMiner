export type Coordinates = {
  lat: number;
  lng: number;
};

export type Place = {
  id: string;
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  location: Coordinates;
  types: string[];
  openNow?: boolean;
};

export type PlaceDetails = Place & {
  phoneNumber?: string;
  internationalPhoneNumber?: string;
  website?: string;
  businessStatus?: string;
  openingHours?: string[];
};
