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
          className="inline-flex items-center gap-2 border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:border-red-400 hover:text-red-600"
        >
          <span>{chip.label}</span>
          <span aria-hidden>×</span>
        </button>
      ))}

      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-slate-400"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
