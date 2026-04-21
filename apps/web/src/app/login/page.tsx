export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage =
    params.error === "invalid_credentials"
      ? "Credenciais invalidas. Verifique e tente novamente."
      : params.error === "auth_unavailable"
        ? "Nao foi possivel conectar ao backend. Confirme se a API esta rodando em http://localhost:3000."
        : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f4d77d_0%,#f6efd8_32%,#eadcb6_100%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] bg-[#16353f] p-8 text-[#f8f3e7] shadow-2xl lg:p-12">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Posto e Conveniencia</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight lg:text-6xl">
            Estoque operacional com rastreabilidade de ponta a ponta.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200/85 lg:text-lg">
            Consulte saldo, registre saidas rapidas e mantenha o cadastro
            administrativo alinhado com a operacao diaria.
          </p>
        </section>

        <section className="rounded-[2rem] border border-slate-900/10 bg-white/80 p-8 shadow-xl backdrop-blur">
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
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#16353f]"
                placeholder="admin@conveniencia.local"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800">Senha</span>
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#16353f]"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#9f2f2f] px-4 py-3 font-semibold text-white transition hover:bg-[#862626]"
            >
              Acessar sistema
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
