"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export default function Toast({ message, type = "error", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === "error";

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
      <div
        className={`flex items-start gap-3 min-w-[320px] max-w-md px-4 py-3.5 rounded-xl shadow-lg border ${
          isError
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-green-50 border-green-200 text-green-800"
        }`}
      >
        {isError ? (
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
        )}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className={`shrink-0 cursor-pointer rounded-md p-0.5 hover:bg-black/5 transition-colors ${
            isError ? "text-red-400" : "text-green-400"
          }`}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}