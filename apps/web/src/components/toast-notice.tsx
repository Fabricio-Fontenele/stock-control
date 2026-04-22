"use client";

import { useEffect, useState } from "react";
import { CheckIcon, ErrorIcon, InfoIcon } from "@/components/ui-icons";

interface ToastNoticeProps {
  message: string;
  tone?: "success" | "error" | "info";
}

const toneClasses: Record<NonNullable<ToastNoticeProps["tone"]>, string> = {
  success: "border-emerald-200 bg-emerald-50/95 text-emerald-800",
  error: "border-red-200 bg-red-50/95 text-red-800",
  info: "border-slate-200 bg-slate-50/95 text-slate-800"
};

const toneIcons = {
  success: CheckIcon,
  error: ErrorIcon,
  info: InfoIcon
} as const;

export function ToastNotice({
  message,
  tone = "success"
}: ToastNoticeProps) {
  const Icon = toneIcons[tone];
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-50">
      <div
        className={`pointer-events-auto min-w-[20rem] max-w-sm rounded-2xl border px-5 py-4 text-sm shadow-xl shadow-slate-900/10 backdrop-blur ${toneClasses[tone]}`}
      >
        <p className="flex items-start gap-2.5 font-medium">
          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </p>
      </div>
    </div>
  );
}
