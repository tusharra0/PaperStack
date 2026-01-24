"use client";

interface Props {
  message: string;
  type?: "error" | "warning" | "info";
  onClose?: () => void;
}

export default function ErrorMessage({ message, type = "error", onClose }: Props) {
  const styles = {
    error: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
  } as const;

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${styles[type]}`}>
      <span className="mt-0.5 font-semibold capitalize">{type}</span>
      <div className="flex-1">{message}</div>
      {onClose && (
        <button
          aria-label="Dismiss"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          ×
        </button>
      )}
    </div>
  );
}
