"use client";

type ToastProps = {
  message: string;
  type: "success" | "error";
};

export default function Toast({ message, type }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      <div
        className={[
          "rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg",
          type === "success"
            ? "border-green-700 bg-green-900/95 text-green-200"
            : "border-red-700 bg-red-900/95 text-red-200",
        ].join(" ")}
      >
        {message}
      </div>
    </div>
  );
}
