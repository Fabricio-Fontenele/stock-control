"use client";

import { useEffect, useState } from "react";
import { CheckIcon, ErrorIcon, InfoIcon } from "@/components/ui-icons";

interface ToastNoticeProps {
  message: string;
  tone?: "success" | "error" | "info";
}

const toneClasses: Record<NonNullable<ToastNoticeProps["tone"]>, string> = {
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  error: "border-rose-300 bg-rose-50 text-rose-900",
  info: "border-slate-300 bg-slate-50 text-slate-900"
};

const progressToneClasses: Record<NonNullable<ToastNoticeProps["tone"]>, string> = {
  success: "bg-emerald-500/70",
  error: "bg-rose-500/70",
  info: "bg-slate-500/70"
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
    }, 4200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 sm:left-auto sm:right-5 sm:top-5 sm:w-full sm:max-w-sm sm:translate-x-0">
      <div
        className={`pointer-events-auto overflow-hidden rounded-2xl border text-sm shadow-[0_16px_40px_-18px_rgba(15,23,42,0.45)] ${toneClasses[tone]}`}
        style={{ animation: "toast-enter 220ms ease-out both" }}
      >
        <div className="flex items-start gap-3 px-4 py-3.5">
          <span className="mt-0.5 rounded-full bg-white/70 p-1">
            <Icon className="h-4 w-4 shrink-0" />
          </span>
          <p className="flex-1 font-medium leading-5">{message}</p>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded-md px-1.5 py-0.5 text-xs font-semibold text-slate-600 transition hover:bg-black/5"
            aria-label="Fechar notificacao"
          >
            Fechar
          </button>
        </div>
        <div className="h-1.5 w-full bg-black/5">
          <div
            className={`h-full ${progressToneClasses[tone]}`}
            style={{
              width: "100%",
              animation: "toast-progress 4.2s linear forwards"
            }}
          />
        </div>
      </div>
    </div>
  );
}
