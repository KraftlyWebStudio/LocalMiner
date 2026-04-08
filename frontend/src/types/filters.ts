export type FilterState = {
  minRating: number | null;
  openNow: boolean;
  hasPhone: boolean;
  hasWebsite: boolean;
  radius: number;
  categories: string[];
};

export const DEFAULT_FILTERS: FilterState = {
  minRating: null,
  openNow: false,
  hasPhone: false,
  hasWebsite: false,
  radius: 20000,
  categories: [],
};
