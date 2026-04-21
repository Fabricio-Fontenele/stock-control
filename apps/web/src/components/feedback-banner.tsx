interface FeedbackBannerProps {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}

const toneClasses: Record<FeedbackBannerProps["tone"], string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-slate-200 bg-slate-50 text-slate-700"
};

export function FeedbackBanner({ tone, children }: FeedbackBannerProps) {
  return (
    <div className={`rounded-[1.75rem] border p-6 text-sm ${toneClasses[tone]}`}>
      {children}
    </div>
  );
}
