import { CheckIcon, ErrorIcon, InfoIcon } from "@/components/ui-icons";

interface FeedbackBannerProps {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}

const toneClasses: Record<FeedbackBannerProps["tone"], string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-slate-200 bg-slate-50 text-slate-700"
};

const toneIcons = {
  error: ErrorIcon,
  success: CheckIcon,
  info: InfoIcon
} as const;

export function FeedbackBanner({ tone, children }: FeedbackBannerProps) {
  const Icon = toneIcons[tone];

  return (
    <div className={`rounded-[1.75rem] border p-6 text-sm ${toneClasses[tone]}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5">
          <Icon className="h-4 w-4" />
        </span>
        <div className="leading-6">{children}</div>
      </div>
    </div>
  );
}
