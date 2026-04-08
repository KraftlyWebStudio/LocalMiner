"use client";

import { useCallback, useMemo, useState } from "react";

import { Place } from "@/types/place";
import { ALL_EXPORT_FIELDS, ExportField, exportToCSV, exportToXLSX } from "@/utils/exportHelpers";

type ExportMode = "selected" | "all";
type ExportFormat = "csv" | "xlsx";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

function buildDefaultFileName(): string {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0] ?? "export";
  return `localminer-export-${dateStr}`;
}

function cloneDefaultFields(): ExportField[] {
  return ALL_EXPORT_FIELDS.map((field) => ({ ...field }));
}

export function useExport(filteredPlaces: Place[]) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>("all");
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [selectedFields, setSelectedFields] = useState<ExportField[]>(cloneDefaultFields);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [fileName, setFileName] = useState(buildDefaultFileName());
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const placesToExport = useMemo(() => {
    return exportMode === "selected" ? selectedPlaces : filteredPlaces;
  }, [exportMode, filteredPlaces, selectedPlaces]);

  const exportCount = placesToExport.length;

  const openModalForSelected = useCallback((places: Place[]) => {
    setExportMode("selected");
    setSelectedPlaces(places);
    setSelectedFields(cloneDefaultFields());
    setExportFormat("csv");
    setFileName(buildDefaultFileName());
    setShowSuccess(false);
    setIsModalOpen(true);
  }, []);

  const openModalForAll = useCallback(() => {
    setExportMode("all");
    setSelectedPlaces([]);
    setSelectedFields(cloneDefaultFields());
    setExportFormat("csv");
    setFileName(buildDefaultFileName());
    setShowSuccess(false);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (isExporting) {
      return;
    }
    setIsModalOpen(false);
  }, [isExporting]);

  const toggleField = useCallback((key: string) => {
    setSelectedFields((prev) => {
      return prev.map((field) => {
        if (field.key !== key) {
          return field;
        }
        return { ...field, enabled: !field.enabled };
      });
    });
  }, []);

  const selectAllFields = useCallback(() => {
    setSelectedFields((prev) => prev.map((field) => ({ ...field, enabled: true })));
  }, []);

  const deselectAllFields = useCallback(() => {
    setSelectedFields((prev) => prev.map((field) => ({ ...field, enabled: false })));
  }, []);

  const setFormat = useCallback((format: ExportFormat) => {
    setExportFormat(format);
  }, []);

  const setFileNameValue = useCallback((name: string) => {
    setFileName(name);
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const triggerExport = useCallback(async () => {
    const enabledFields = selectedFields.filter((field) => field.enabled);

    if (enabledFields.length === 0 || placesToExport.length === 0) {
      return;
    }

    const resolvedFileName = fileName.trim() || buildDefaultFileName();

    setIsExporting(true);
    setShowSuccess(false);

    try {
      let usedFormat: ExportFormat = exportFormat;

      if (exportFormat === "xlsx") {
        try {
          await exportToXLSX(placesToExport, enabledFields, resolvedFileName);
        } catch {
          exportToCSV(placesToExport, enabledFields, resolvedFileName);
          usedFormat = "csv";
          setToast({ message: "✗ Excel export unavailable. Downloaded CSV instead.", type: "error" });
        }
      } else {
        exportToCSV(placesToExport, enabledFields, resolvedFileName);
      }

      setShowSuccess(true);
      setToast({
        message: `✓ Exported ${placesToExport.length} businesses to ${usedFormat.toUpperCase()}`,
        type: "success",
      });

      window.setTimeout(() => {
        setIsModalOpen(false);
        setShowSuccess(false);
      }, 1500);
    } catch {
      setToast({ message: "✗ Export failed. Please try again.", type: "error" });
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat, fileName, placesToExport, selectedFields]);

  return {
    isModalOpen,
    exportMode,
    exportCount,
    placesToExport,
    selectedFields,
    exportFormat,
    fileName,
    isExporting,
    showSuccess,
    openModalForSelected,
    openModalForAll,
    closeModal,
    toggleField,
    selectAllFields,
    deselectAllFields,
    setFormat,
    setFileName: setFileNameValue,
    triggerExport,
    toast,
    clearToast,
  };
}
