import { CheckIcon, ErrorIcon, InfoIcon } from "@/components/ui-icons";

interface FeedbackBannerProps {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}

const toneClasses: Record<FeedbackBannerProps["tone"], string> = {
  error: "border-red-200/90 bg-red-50/90 text-red-800",
  success: "border-emerald-200/90 bg-emerald-50/90 text-emerald-800",
  info: "border-slate-200/90 bg-slate-50/90 text-slate-800"
};

const toneIcons = {
  error: ErrorIcon,
  success: CheckIcon,
  info: InfoIcon
} as const;

export function FeedbackBanner({ tone, children }: FeedbackBannerProps) {
  const Icon = toneIcons[tone];

  return (
    <div className={`rounded-[1.4rem] border p-5 text-sm shadow-sm ${toneClasses[tone]}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-white/50 p-1">
          <Icon className="h-4 w-4" />
        </span>
        <div className="leading-6">{children}</div>
      </div>
    </div>
  );
}
