"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}

interface ToastNotificationProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function ToastNotification({ toast, onDismiss }: ToastNotificationProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4200);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#e5e7eb] shadow-lg max-w-md">
        <div className="shrink-0">
          {toast.type === "success" && (
            <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          )}
          {toast.type === "error" && (
            <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          )}
          {toast.type === "info" && (
            <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0099ff]">
              <Info className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#101010] leading-tight">{toast.title}</p>
          {toast.description && (
            <p className="text-[11px] text-[#6b7280] mt-0.5 leading-snug">{toast.description}</p>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-md text-[#9ca3af] hover:text-[#101010] hover:bg-[#f3f4f6] transition-colors cursor-pointer ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
