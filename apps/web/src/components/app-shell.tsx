import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";

import type { SessionUser } from "@/lib/auth/session";
import {
  AlertIcon,
  ArrowOutIcon,
  BoxIcon,
  FactoryIcon,
  TagIcon,
  UsersIcon
} from "@/components/ui-icons";

const baseItems = [
  { href: "/estoque" as Route, label: "Estoque", icon: BoxIcon }
];

const adminItems = [
  { href: "/alertas" as Route, label: "Alertas", icon: AlertIcon },
  { href: "/produtos" as Route, label: "Catalogo", icon: TagIcon },
  { href: "/categorias" as Route, label: "Categorias", icon: TagIcon },
  { href: "/fornecedores" as Route, label: "Fornecedores", icon: FactoryIcon },
  { href: "/funcionarios" as Route, label: "Funcionarios", icon: UsersIcon }
];

interface AppShellProps {
  user: SessionUser;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const items = user.role === "admin" ? [...baseItems, ...adminItems] : baseItems;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6efd8_0%,#efe3bf_100%)] text-slate-900">
      <aside className="border-b border-slate-900/10 bg-[#16353f] px-6 py-6 text-[#f8f3e7] lg:fixed lg:inset-y-0 lg:left-0 lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Conveniencia</p>
            <h1 className="mt-2 text-2xl font-semibold">Controle de Estoque</h1>
            <p className="mt-3 text-sm text-slate-200/80">
              Operacao rapida no balcao e administracao centralizada.
            </p>
          </div>

          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-slate-200/70">{user.email}</p>
            <p className="mt-2 inline-flex rounded-full bg-amber-300 px-2 py-1 text-xs font-semibold uppercase text-slate-950">
              {user.role}
            </p>
          </div>

          <nav className="space-y-2">
            <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-300/80">Navegacao</p>
            {items.map((item) => (
              (() => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })()
            ))}
          </nav>

          <form action="/api/auth/logout" method="post" className="mt-8">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#9f2f2f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#842626]"
            >
              <ArrowOutIcon className="h-4 w-4" />
              Sair
            </button>
          </form>
      </aside>

      <main className="mx-auto max-w-7xl px-5 py-6 lg:ml-80 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}