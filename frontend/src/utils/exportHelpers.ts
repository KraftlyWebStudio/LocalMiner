import { Place } from "@/types/place";

type PlaceWithOptionalFields = Place & {
  vicinity?: string;
  formatted_phone_number?: string;
  user_ratings_total?: number;
  website?: string;
  url?: string;
  business_status?: string;
  opening_hours?: {
    open_now?: boolean;
  };
};

export interface ExportField {
  key: string;
  label: string;
  enabled: boolean;
  getValue: (place: Place) => string;
}

function formatCategory(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export const ALL_EXPORT_FIELDS: ExportField[] = [
  {
    key: "name",
    label: "Business Name",
    enabled: true,
    getValue: (place) => place.name ?? "",
  },
  {
    key: "category",
    label: "Category",
    enabled: true,
    getValue: (place) => formatCategory(place.types?.[0] ?? ""),
  },
  {
    key: "address",
    label: "Address",
    enabled: true,
    getValue: (place) => {
      const extended = place as PlaceWithOptionalFields;
      return extended.vicinity ?? place.address ?? "";
    },
  },
  {
    key: "phone",
    label: "Phone Number",
    enabled: true,
    getValue: (place) => {
      const extended = place as PlaceWithOptionalFields;
      return extended.formatted_phone_number ?? "";
    },
  },
  {
    key: "rating",
    label: "Rating",
    enabled: true,
    getValue: (place) => place.rating?.toString() ?? "",
  },
  {
    key: "reviewCount",
    label: "Review Count",
    enabled: true,
    getValue: (place) => {
      const extended = place as PlaceWithOptionalFields;
      return (extended.user_ratings_total ?? place.userRatingsTotal)?.toString() ?? "";
    },
  },
  {
    key: "website",
    label: "Website",
    enabled: true,
    getValue: (place) => {
      const extended = place as PlaceWithOptionalFields;
      return extended.website ?? "";
    },
  },
  {
    key: "mapsUrl",
    label: "Google Maps URL",
    enabled: true,
    getValue: (place) => {
      const extended = place as PlaceWithOptionalFields;
      return extended.url ?? `https://www.google.com/maps/place/?q=place_id:${place.placeId}`;
    },
  },
  {
    key: "status",
    label: "Business Status",
    enabled: true,
    getValue: (place) => {
      const extended = place as PlaceWithOptionalFields;
      return extended.business_status ?? "";
    },
  },
  {
    key: "openNow",
    label: "Open Now",
    enabled: false,
    getValue: (place) => {
      const extended = place as PlaceWithOptionalFields;
      const openNow = extended.opening_hours?.open_now ?? place.openNow;
      return openNow ? "Yes" : "No";
    },
  },
];

function escapeCsvValue(value: string): string {
  const normalized = value ?? "";
  const escaped = normalized.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function exportToCSV(places: Place[], fields: ExportField[], fileName: string): void {
  const safeFileName = fileName.trim() || "localminer-export";
  const headers = fields.map((field) => escapeCsvValue(field.label)).join(",");
  const dataRows = places.map((place) => {
    return fields.map((field) => escapeCsvValue(field.getValue(place))).join(",");
  });

  const csvContent = [headers, ...dataRows].join("\n");
  const csvWithBom = `\uFEFF${csvContent}`;
  const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToXLSX(
  places: Place[],
  fields: ExportField[],
  fileName: string,
): Promise<void> {
  const XLSX = await import("xlsx");
  const safeFileName = fileName.trim() || "localminer-export";

  const data: string[][] = [fields.map((field) => field.label)];
  for (const place of places) {
    data.push(fields.map((field) => field.getValue(place)));
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  const columnWidths = fields.map((field, columnIndex) => {
    let maxLength = field.label.length;
    for (let rowIndex = 1; rowIndex < data.length; rowIndex += 1) {
      maxLength = Math.max(maxLength, (data[rowIndex]?.[columnIndex] ?? "").length);
    }
    return { wch: Math.min(maxLength + 2, 50) };
  });
  worksheet["!cols"] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "LocalMiner Export");
  XLSX.writeFile(workbook, `${safeFileName}.xlsx`);
}
