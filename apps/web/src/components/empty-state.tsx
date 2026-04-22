import type { Route } from "next";
import Link from "next/link";
import { BoxIcon } from "@/components/ui-icons";

interface EmptyStateProps {
  title: string;
  description: string;
  actionHref?: Route;
  actionLabel?: string;
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel
}: EmptyStateProps) {
  return (
    <div className="hero-card p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#16353f]/10 text-[#16353f]">
          <BoxIcon className="h-4 w-4" />
        </span>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      {actionHref && actionLabel ? (
        <div className="mt-5">
          <Link
            href={actionHref}
            className="btn-brand inline-flex rounded-2xl px-4 py-3 text-sm font-semibold"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
