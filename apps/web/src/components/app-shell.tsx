"use client";

import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { SessionUser } from "@/lib/auth/session";
import { BrandMark } from "@/components/brand-mark";
import {
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
  const pathname = usePathname();
  const items = user.role === "admin" ? [...baseItems, ...adminItems] : baseItems;

  return (
    <div className="min-h-screen text-slate-900">
      <aside className="border-b border-[#24414a]/10 bg-[linear-gradient(170deg,#143740_0%,#0e2d34_100%)] px-6 py-6 text-[#f8f3e7] lg:fixed lg:inset-y-0 lg:left-0 lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-r-[#071a1f]/35">
        <div className="mb-8">
          <div className="flex flex-col items-center text-center">
            <BrandMark className="h-28 w-28 border border-white/20 bg-white/8 p-2" />
            <h1 className="mt-4 text-lg font-semibold text-slate-100">
              Controle de Estoque da Conveniencia
            </h1>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-white/15 bg-white/6 p-4 backdrop-blur-sm">
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
              const isActive =
                pathname === item.href ||
                (item.href !== "/estoque" && pathname.startsWith(`${item.href}/`)) ||
                (item.href === "/estoque" && pathname.startsWith("/estoque"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "border-white/20 bg-white/16 text-white"
                      : "border-transparent text-slate-100 hover:border-white/10 hover:bg-white/10"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition ${
                      isActive ? "text-white" : "text-slate-200 group-hover:text-white"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })()
          ))}
        </nav>

        <form action="/api/auth/logout" method="post" className="mt-8">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#9f2f2f] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#000]/10 transition hover:bg-[#842626]"
          >
            <ArrowOutIcon className="h-4 w-4" />
            Sair
          </button>
        </form>
      </aside>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 lg:ml-80 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
