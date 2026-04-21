"use client";

import { useEffect, useState } from "react";

interface ToastNoticeProps {
  message: string;
  tone?: "success" | "error" | "info";
}

const toneClasses: Record<NonNullable<ToastNoticeProps["tone"]>, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-slate-200 bg-slate-50 text-slate-700"
};

export function ToastNotice({
  message,
  tone = "success"
}: ToastNoticeProps) {
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
        className={`pointer-events-auto min-w-[20rem] max-w-sm rounded-3xl border px-5 py-4 text-sm shadow-lg backdrop-blur ${toneClasses[tone]}`}
      >
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
}
