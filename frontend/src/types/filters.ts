export type FilterState = {
  minRating: number | null;
  openNow: boolean;
  hasPhone: boolean;
  hasWebsite: boolean;
  radius: number;
  categories: string[];
};

export const MIN_RADIUS_METERS = 1_000;
export const MAX_RADIUS_METERS = 50_000;

export const DEFAULT_FILTERS: FilterState = {
  minRating: null,
  openNow: false,
  hasPhone: false,
  hasWebsite: false,
  radius: 20000,
  categories: [],
};
