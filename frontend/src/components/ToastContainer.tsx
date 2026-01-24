"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info";

export type ToastPayload = {
  message: string;
  type?: ToastType;
};

let toastCounter = 0;

export function showToast(message: string, type: ToastType = "info") {
  if (typeof window === "undefined") return;
  const event = new CustomEvent<ToastPayload>("toast", { detail: { message, type } });
  window.dispatchEvent(event);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<ToastPayload>;
      toastCounter += 1;
      const toast = { id: toastCounter, message: custom.detail.message, type: custom.detail.type || "info" };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3500);
    };
    window.addEventListener("toast", handler as EventListener);
    return () => window.removeEventListener("toast", handler as EventListener);
  }, []);

  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-[220px] rounded-lg px-4 py-3 text-sm shadow-lg transition ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-slate-800 text-white"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>,
    document.body
  );
}

