"use client";

import { useCallback, useMemo, useState } from "react";

import { DEFAULT_FILTERS, FilterState } from "@/types/filters";
import { Place } from "@/types/place";

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const setMinRating = useCallback((rating: number | null) => {
    setFilters((prev) => ({ ...prev, minRating: rating }));
  }, []);

  const toggleOpenNow = useCallback(() => {
    setFilters((prev) => ({ ...prev, openNow: !prev.openNow }));
  }, []);

  const toggleHasPhone = useCallback(() => {
    setFilters((prev) => ({ ...prev, hasPhone: !prev.hasPhone }));
  }, []);

  const toggleHasWebsite = useCallback(() => {
    setFilters((prev) => ({ ...prev, hasWebsite: !prev.hasWebsite }));
  }, []);

  const setRadius = useCallback((meters: number) => {
    setFilters((prev) => ({ ...prev, radius: meters }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setFilters((prev) => {
      const exists = prev.categories.includes(category);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((item) => item !== category)
          : [...prev.categories, category],
      };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const isAnyFilterActive = useMemo(() => {
    return (
      filters.minRating !== null ||
      filters.openNow ||
      filters.hasPhone ||
      filters.hasWebsite ||
      filters.radius !== DEFAULT_FILTERS.radius ||
      filters.categories.length > 0
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.minRating !== null) count += 1;
    if (filters.openNow) count += 1;
    if (filters.hasPhone) count += 1;
    if (filters.hasWebsite) count += 1;
    if (filters.radius !== DEFAULT_FILTERS.radius) count += 1;
    count += filters.categories.length;
    return count;
  }, [filters]);

  const applyFilters = useCallback(
    (places: Place[]): Place[] => {
      return places.filter((place) => {
        if (filters.minRating !== null && (place.rating ?? 0) < filters.minRating) {
          return false;
        }

        if (filters.openNow && place.openNow !== true) {
          return false;
        }

        if (filters.hasPhone && !place.phoneNumber?.trim()) {
          return false;
        }

        if (filters.hasWebsite && !place.website?.trim()) {
          return false;
        }

        if (
          filters.categories.length > 0 &&
          !place.types.some((type) => filters.categories.includes(type.toLowerCase()))
        ) {
          return false;
        }

        if (typeof place.distanceMeters === "number" && place.distanceMeters > filters.radius) {
          return false;
        }

        return true;
      });
    },
    [filters],
  );

  return {
    filters,
    setMinRating,
    toggleOpenNow,
    toggleHasPhone,
    toggleHasWebsite,
    setRadius,
    toggleCategory,
    resetFilters,
    isAnyFilterActive,
    activeFilterCount,
    applyFilters,
  };
}
