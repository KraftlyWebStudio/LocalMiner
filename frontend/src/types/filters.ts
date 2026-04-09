export type TriStateFilter = "any" | "yes" | "no";

export type FilterState = {
  minRating: number | null;
  openNow: TriStateFilter;
  hasPhone: TriStateFilter;
  hasWebsite: TriStateFilter;
  radius: number;
  categories: string[];
};

export const MIN_RADIUS_METERS = 1_000;
export const MAX_RADIUS_METERS = 200_000;

export const DEFAULT_FILTERS: FilterState = {
  minRating: null,
  openNow: "any",
  hasPhone: "any",
  hasWebsite: "any",
  radius: 20000,
  categories: [],
};
