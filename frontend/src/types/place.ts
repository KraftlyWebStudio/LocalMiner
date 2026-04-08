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
  distanceMeters?: number;
};

export type SocialProfiles = {
  instagram?: string;
  facebook?: string;
  x?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
};

export type PlaceEnrichment = {
  email: string | null;
  socialProfiles: SocialProfiles;
};

export type PlaceDetails = Place & {
  phoneNumber?: string;
  internationalPhoneNumber?: string;
  website?: string;
  mapsUrl?: string;
  email?: string;
  socialProfiles?: SocialProfiles;
  businessStatus?: string;
  openingHours?: string[];
};
