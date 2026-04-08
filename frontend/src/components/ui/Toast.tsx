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
          "border px-4 py-3 text-sm font-semibold shadow-md",
          type === "success"
            ? "border-green-300 bg-green-50 text-green-700"
            : "border-red-300 bg-red-50 text-red-700",
        ].join(" ")}
      >
        {message}
      </div>
    </div>
  );
}
