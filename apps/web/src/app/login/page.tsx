import { PasswordField } from "@/components/password-field";
import { BrandMark } from "@/components/brand-mark";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const apiBaseUrl =
    process.env.STOCK_CONTROL_API_URL ??
    process.env.NEXT_PUBLIC_STOCK_CONTROL_API_URL ??
    "http://localhost:3333";
  const errorMessage =
    params.error === "invalid_credentials"
      ? "Credenciais invalidas. Verifique e tente novamente."
      : params.error === "auth_unavailable"
        ? `Nao foi possivel conectar ao backend. Confirme se a API esta rodando em ${apiBaseUrl}.`
        : null;

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] bg-[linear-gradient(165deg,#163b44_0%,#0f2f36_100%)] p-8 text-[#f8f3e7] shadow-2xl shadow-[#0f2f36]/30 lg:p-12">
          <div className="mb-8 flex flex-col items-center text-center">
            <BrandMark className="h-36 w-36 border border-white/20 bg-white/8 p-2 lg:h-44 lg:w-44" />
            <h1 className="mt-5 max-w-xl text-3xl font-semibold leading-tight lg:text-5xl">
              Controle de Estoque da Conveniencia
            </h1>
          </div>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200/85 lg:text-lg">
            Consulte saldo, registre saidas rapidas e mantenha o cadastro
            administrativo alinhado com a operacao diaria.
          </p>
        </section>

        <section className="hero-card p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold text-slate-950">Entrar</h2>
          <p className="mt-2 text-sm text-slate-600">
            Use suas credenciais para acessar a operacao ou a area administrativa.
          </p>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <form action="/api/auth/login" method="post" className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800">E-mail</span>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-2xl bg-white px-4 py-3"
                placeholder="admin@conveniencia.local"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800">Senha</span>
              <PasswordField
                name="password"
                className="w-full rounded-2xl bg-white px-4 py-3"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            <button
              type="submit"
              className="btn-accent w-full rounded-2xl px-4 py-3 font-semibold shadow-lg shadow-[#8a3329]/20"
            >
              Acessar sistema
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
