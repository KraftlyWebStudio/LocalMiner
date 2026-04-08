"use client";

import { useEffect } from "react";

import { Place } from "@/types/place";
import { ExportField } from "@/utils/exportHelpers";

interface ExportModalProps {
  isOpen: boolean;
  exportMode: "selected" | "all";
  exportCount: number;
  placesToExport: Place[];
  selectedFields: ExportField[];
  exportFormat: "csv" | "xlsx";
  fileName: string;
  isExporting: boolean;
  showSuccess: boolean;
  onClose: () => void;
  onToggleField: (key: string) => void;
  onSelectAllFields: () => void;
  onDeselectAllFields: () => void;
  onFormatChange: (format: "csv" | "xlsx") => void;
  onFileNameChange: (name: string) => void;
  onExport: () => void;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

export default function ExportModal({
  isOpen,
  exportMode,
  exportCount,
  placesToExport,
  selectedFields,
  exportFormat,
  fileName,
  isExporting,
  showSuccess,
  onClose,
  onToggleField,
  onSelectAllFields,
  onDeselectAllFields,
  onFormatChange,
  onFileNameChange,
  onExport,
}: ExportModalProps) {
  const enabledFields = selectedFields.filter((field) => field.enabled);
  const previewRows = placesToExport.slice(0, 3);
  const exportDisabled = enabledFields.length === 0 || exportCount === 0 || isExporting;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70" onClick={onClose}>
      <div className="mx-auto mt-16 w-full max-w-2xl px-4" onClick={(event) => event.stopPropagation()}>
        <div className="max-h-[85vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-900">
          <div className="sticky top-0 z-10 border-b border-gray-700 bg-gray-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Export {exportMode === "all" ? "All" : "Selected"} Data</h2>
            <p className="mt-1 text-sm text-gray-300">{exportCount} businesses ready for export</p>
          </div>

          <div className="space-y-6 px-6 py-5">
            <section>
              <p className="mb-3 text-xs uppercase tracking-wider text-gray-400">Fields</p>
              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={onSelectAllFields}
                  className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:border-red-500"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={onDeselectAllFields}
                  className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:border-red-500"
                >
                  Deselect All
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {selectedFields.map((field) => (
                  <label key={field.key} className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={field.enabled}
                      onChange={() => onToggleField(field.key)}
                      className="h-4 w-4 accent-red-500"
                    />
                    <span>{field.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-3 text-xs uppercase tracking-wider text-gray-400">Format</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onFormatChange("csv")}
                  className={[
                    "flex items-center gap-3 rounded-lg border p-3 text-left",
                    exportFormat === "csv"
                      ? "border-red-500 bg-gray-800"
                      : "border-gray-700 bg-gray-800/50",
                  ].join(" ")}
                >
                  <span>📄</span>
                  <span className="text-sm font-semibold text-gray-200">CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => onFormatChange("xlsx")}
                  className={[
                    "flex items-center gap-3 rounded-lg border p-3 text-left",
                    exportFormat === "xlsx"
                      ? "border-red-500 bg-gray-800"
                      : "border-gray-700 bg-gray-800/50",
                  ].join(" ")}
                >
                  <span>📊</span>
                  <span className="text-sm font-semibold text-gray-200">Excel (.xlsx)</span>
                </button>
              </div>
            </section>

            <section>
              <p className="mb-3 text-xs uppercase tracking-wider text-gray-400">File Name</p>
              <input
                type="text"
                value={fileName}
                onChange={(event) => onFileNameChange(event.target.value)}
                placeholder="localminer-export"
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </section>

            <section>
              <p className="mb-3 text-xs uppercase tracking-wider text-gray-400">Preview</p>

              {enabledFields.length === 0 && (
                <p className="rounded-lg border border-yellow-700 bg-yellow-950/40 px-3 py-2 text-sm text-yellow-300">
                  Select at least one field
                </p>
              )}

              {exportCount === 0 && (
                <p className="rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-gray-300">
                  No data to export
                </p>
              )}

              {enabledFields.length > 0 && exportCount > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-700">
                  <table className="min-w-full text-xs text-gray-200">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        {enabledFields.map((field) => (
                          <th key={field.key} className="border-b border-gray-700 px-2 py-2 text-left font-semibold">
                            {field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((place) => (
                        <tr key={place.placeId} className="border-b border-gray-800 last:border-b-0">
                          {enabledFields.map((field) => (
                            <td key={`${place.placeId}-${field.key}`} className="max-w-[180px] px-2 py-2">
                              {truncateText(field.getValue(place), 42)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-700 bg-gray-900 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="rounded-lg bg-gray-700 px-6 py-2 text-white hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onExport}
              disabled={exportDisabled}
              className={[
                "inline-flex items-center gap-2 rounded-lg px-6 py-2 text-white",
                showSuccess
                  ? "bg-green-600"
                  : "bg-red-600 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              {isExporting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {showSuccess ? "✓ Exported!" : isExporting ? "Exporting..." : "Export Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
