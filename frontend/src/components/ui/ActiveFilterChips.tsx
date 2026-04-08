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
          className="inline-flex items-center gap-2 border border-zinc-700 bg-zinc-900/70 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:border-red-500 hover:text-red-300"
        >
          <span>{chip.label}</span>
          <span aria-hidden>×</span>
        </button>
      ))}

      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:border-zinc-500"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
