import { redirect } from "next/navigation";
import { apiFetch, BackendError } from "@/lib/api/backend";
import { EmptyState } from "@/components/empty-state";
import { FeedbackBanner } from "@/components/feedback-banner";
import { requireAdminSession } from "@/lib/auth/guards";
import type { DashboardAlertsView } from "@/lib/api/types";

const alertSections = [
  {
    key: "belowMinimum",
    title: "Estoque baixo",
    description: "Produtos abaixo do minimo configurado",
    accent: "bg-red-100 text-red-700"
  }
] as const;

export default async function AlertasPage() {
  await requireAdminSession();

  let alerts: DashboardAlertsView | null = null;
  let errorMessage: string | null = null;

  try {
    alerts = await apiFetch<DashboardAlertsView>("/dashboard/alerts", {
      authenticated: true
    });
  } catch (error) {
    if (error instanceof BackendError) {
      if (error.status === 401) {
        redirect("/login");
      }

      errorMessage = error.message;
    } else {
      errorMessage = "Falha ao carregar alertas";
    }
  }

  return (
    <section className="space-y-6">
      <header className="hero-card p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Administracao</p>
        <h1 className="mt-2 text-3xl font-semibold">Alertas</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          Painel administrativo para acompanhamento de produtos abaixo do estoque minimo.
        </p>
      </header>

      {errorMessage ? (
        <FeedbackBanner tone="error">{errorMessage}</FeedbackBanner>
      ) : null}

      {alerts ? (
        <>
          <div className="grid gap-4 md:grid-cols-1">
            <div className="surface-card p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estoque baixo</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{alerts.belowMinimum.length}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-1">
          {alertSections.map((section) => {
            const items = alerts?.[section.key] ?? [];

            return (
              <article
                key={section.key}
                className="surface-card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {section.description}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${section.accent}`}>
                    {items.length}
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {items.length === 0 ? (
                    <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                      Nenhum item neste grupo.
                    </div>
                  ) : null}

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                            {item.sku}
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-slate-950">
                            {item.name}
                          </h3>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">
                          {item.availableQuantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
          </div>
          {alerts.belowMinimum.length === 0 ? (
            <EmptyState
              title="Nenhum alerta ativo"
              description="Neste momento nao ha produtos abaixo do minimo."
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}
