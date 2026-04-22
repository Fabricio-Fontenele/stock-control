# Funcionarios/UI Stability - 2026-04-22

## Objetivo da Jornada

Estabilizar os fluxos de autenticacao e gerenciamento de funcionarios no frontend, removendo regressoes de CORS, inconsistencias de URL de backend e problemas de usabilidade no campo de senha.

## Problemas Corrigidos

- Erro de conexao no login por uso inconsistente de variaveis de ambiente da API.
- Mensagem de erro do login fixa em `localhost:3000`, divergente da configuracao real.
- CORS na tela de funcionarios por chamadas diretas do browser para `http://localhost:3333/users`.
- Fluxo de senha na tela de funcionarios com UX instavel (toggle/"olhinho" desaparecendo).
- Duplicidade entre componente novo e implementacao legado de senha.

## Solucao Aplicada

- Alinhamento de `API_BASE_URL` no login para aceitar:
  - `STOCK_CONTROL_API_URL`
  - `NEXT_PUBLIC_STOCK_CONTROL_API_URL`
  - fallback `http://localhost:3333`
- Mensagem de erro do login agora usa a URL efetiva configurada em runtime.
- Tela `/funcionarios` refatorada para server-first:
  - listagem via Server Component
  - criacao/exclusao/alteracao de senha via Server Actions
  - eliminacao de fetch client-side direto para a API (remove dependencia de CORS).
- Criado componente reutilizavel `PasswordField` com toggle mostrar/ocultar estavel.
- `PasswordField` aplicado em `/funcionarios` e `/login`.
- Removido componente legado `user-card.tsx` para evitar coexistencia de comportamentos antigos.
- CSS global ajustado para ocultar controles nativos de reveal de senha e manter apenas o controle customizado.

## Validacao Executada

- Build frontend (`apps/web`) concluido com sucesso apos as alteracoes.

## Arquivos de Destaque

- `apps/web/src/app/(protected)/funcionarios/page.tsx`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/api/auth/login/route.ts`
- `apps/web/src/components/password-field.tsx`
- `apps/web/src/components/ui-icons.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/.env.example`

## Proximo Passo (Aprovado para a proxima jornada)

Refatorar toda a UI para um padrao visual mais forte e consistente (layout, hierarquia tipografica, componentes, espacamento, estados de feedback e responsividade), preservando o comportamento funcional que foi estabilizado nesta entrega.
