import type { Route } from "next";
import Link from "next/link";

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
    <div className="rounded-[1.75rem] border border-slate-900/10 bg-white/70 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      {actionHref && actionLabel ? (
        <div className="mt-5">
          <Link
            href={actionHref}
            className="inline-flex rounded-2xl bg-[#16353f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2a33]"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
