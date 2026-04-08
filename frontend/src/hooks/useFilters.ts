"use client";

import { useCallback, useMemo, useState } from "react";

import { DEFAULT_FILTERS, FilterState, TriStateFilter } from "@/types/filters";
import { Place } from "@/types/place";

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const setMinRating = useCallback((rating: number | null) => {
    setFilters((prev) => ({ ...prev, minRating: rating }));
  }, []);

  const setOpenNowFilter = useCallback((value: TriStateFilter) => {
    setFilters((prev) => ({ ...prev, openNow: value }));
  }, []);

  const setHasPhoneFilter = useCallback((value: TriStateFilter) => {
    setFilters((prev) => ({ ...prev, hasPhone: value }));
  }, []);

  const setHasWebsiteFilter = useCallback((value: TriStateFilter) => {
    setFilters((prev) => ({ ...prev, hasWebsite: value }));
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
      filters.openNow !== "any" ||
      filters.hasPhone !== "any" ||
      filters.hasWebsite !== "any" ||
      filters.radius !== DEFAULT_FILTERS.radius ||
      filters.categories.length > 0
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.minRating !== null) count += 1;
    if (filters.openNow !== "any") count += 1;
    if (filters.hasPhone !== "any") count += 1;
    if (filters.hasWebsite !== "any") count += 1;
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

        if (filters.openNow === "yes" && place.openNow !== true) {
          return false;
        }

        if (filters.openNow === "no" && place.openNow !== false) {
          return false;
        }

        const hasPhone = Boolean(place.phoneNumber?.trim());
        if (filters.hasPhone === "yes" && !hasPhone) {
          return false;
        }

        if (filters.hasPhone === "no" && hasPhone) {
          return false;
        }

        const hasWebsite = Boolean(place.website?.trim());
        if (filters.hasWebsite === "yes" && !hasWebsite) {
          return false;
        }

        if (filters.hasWebsite === "no" && hasWebsite) {
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
    setOpenNowFilter,
    setHasPhoneFilter,
    setHasWebsiteFilter,
    setRadius,
    toggleCategory,
    resetFilters,
    isAnyFilterActive,
    activeFilterCount,
    applyFilters,
  };
}
