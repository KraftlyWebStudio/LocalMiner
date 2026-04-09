"use client";

type ActiveFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

type ActiveFilterChipsProps = {
  chips: ActiveFilterChip[];
  onClearAll?: () => void;
};

export default function ActiveFilterChips({ chips, onClearAll }: ActiveFilterChipsProps) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_6px_18px_-14px_rgba(15,35,95,0.9)] hover:border-sky-400 hover:text-sky-700"
        >
          <span>{chip.label}</span>
          <span aria-hidden className="text-sm leading-none">×</span>
        </button>
      ))}

      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-500"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
