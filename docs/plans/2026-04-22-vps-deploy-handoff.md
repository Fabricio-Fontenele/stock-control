# Handoff - Production Readiness + VPS Deploy (2026-04-22)

## Objetivo desta entrega

Parar a sessão com todo o contexto documentado para retomar rapidamente a configuração de staging/produção em VPS com Docker Compose.

## O que foi implementado nesta etapa

### 1) Hardening de ambiente (API + Web)

- API agora valida ambiente de forma mais rígida:
  - `JWT_SECRET` obrigatório em produção.
  - `DATABASE_URL` obrigatório em produção.
  - `CORS_ALLOWED_ORIGINS` obrigatório em produção.
- Web agora valida:
  - `STOCK_CONTROL_API_URL` ou `NEXT_PUBLIC_STOCK_CONTROL_API_URL` em produção.
  - `WEB_SESSION_SECRET` obrigatório e com mínimo de 32 caracteres em produção.

Arquivos:
- `src/infrastructure/config/env.ts`
- `src/server.ts`
- `src/app.ts`
- `apps/web/src/lib/env/server.ts`
- `apps/web/src/lib/api/backend.ts`
- `apps/web/src/lib/auth/session.ts`
- `apps/web/src/app/api/auth/login/route.ts`
- `apps/web/src/app/login/page.tsx`
- `.env.example`

### 2) CORS restrito por allowlist

- Implementado controle por lista de origens (`CORS_ALLOWED_ORIGINS`).
- Preflight `OPTIONS` com bloqueio (`403`) para origem fora da allowlist.

Arquivo principal:
- `src/app.ts`

### 3) Base de deploy em VPS com Docker Compose

- Container da API.
- Container da Web Next.js em modo standalone.
- Compose de staging com `postgres + api + web`.
- Exemplo de `.env.staging`.

Arquivos:
- `Dockerfile`
- `.dockerignore`
- `apps/web/Dockerfile`
- `apps/web/.dockerignore`
- `apps/web/next.config.ts` (`output: "standalone"`)
- `docker-compose.staging.yml`
- `.env.staging.example`

### 4) CI/CD para staging na VPS

- Workflow GitHub Actions para:
  1. build/push da API para GHCR
  2. build/push da Web para GHCR
  3. cópia do compose na VPS
  4. escrita de `.env.staging` via secret
  5. pull/subida de serviços
  6. migração de banco
  7. smoke pós-deploy

Arquivo:
- `.github/workflows/deploy-staging-vps.yml`

### 5) Smoke pós-deploy

- Script dedicado de smoke web:
  - autentica via `/api/auth/login`
  - valida sessão
  - valida rotas críticas:
    - `/`
    - `/estoque`
    - `/estoque/saida`
    - `/entradas`
    - `/produtos`
    - `/fornecedores`
    - `/funcionarios`

Arquivo:
- `scripts/smoke/staging-web-smoke.sh`

### 6) Documentação de prontidão

Arquivos criados/atualizados:
- `docs/plans/2026-04-22-production-readiness-plan.md`
- `docs/plans/2026-04-22-production-readiness-tasks.md`
- `docs/plans/2026-04-22-vps-staging-deploy-runbook.md`

Status de tasks:
- `PRD-003` concluída (CORS).
- `PRD-004` concluída (env obrigatório).
- `PRD-005` concluída (deploy staging workflow).
- `PRD-008` concluída (smoke pós-deploy).

## Validações executadas nesta sessão

- Backend:
  - `npm run build` OK
  - `npm run test:unit` OK
- Web:
  - `cd apps/web && npm run build` OK

## Linha de raciocínio para configurar na VPS depois

### Decisão arquitetural

1. **Imagens imutáveis por commit SHA**:
   - Evita drift de ambiente.
   - Facilita rollback por tag anterior.

2. **Compose no host remoto**:
   - Simples para operação em VPS.
   - Menor custo de manutenção que orquestrador neste estágio.

3. **Segredos via GitHub Secrets**:
   - Nada sensível versionado.
   - `.env.staging` é gerado no host durante deploy.

4. **Migração como etapa explícita do deploy**:
   - Garante schema compatível antes de subir versão nova.
   - Mantém fluxo previsível.

5. **Smoke obrigatório pós-deploy**:
   - Fecha o ciclo com validação funcional mínima.
   - Falha rápida se a entrega estiver quebrada.

### Ordem prática para execução na VPS (quando retomar)

1. Provisionar VPS com Docker + Docker Compose plugin.
2. Criar usuário de deploy e diretório de aplicação.
3. Definir DNS/reverse proxy de staging.
4. Cadastrar todos os secrets no GitHub.
5. Rodar workflow `Deploy Staging (VPS)` manual (`workflow_dispatch`).
6. Confirmar smoke verde.
7. Registrar baseline de rollback (tags e procedimento).

## Secrets que precisam existir no GitHub

### Deploy remoto
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PORT` (opcional)
- `VPS_DEPLOY_PATH`

### Ambiente staging (conteúdo do arquivo)
- `STAGING_ENV_FILE` (conteúdo completo do `.env.staging`)

### Smoke pós-deploy
- `STAGING_BASE_URL`
- `STAGING_ADMIN_EMAIL`
- `STAGING_ADMIN_PASSWORD`

## Conteúdo base para STAGING_ENV_FILE

Usar como base:
- `.env.staging.example`

Campos críticos:
- `DATABASE_NAME`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ALLOWED_ORIGINS`
- `WEB_SESSION_SECRET`
- `NEXT_PUBLIC_STOCK_CONTROL_API_URL`

## Pontos de atenção ao retomar

1. **Reverse proxy/TLS**: importante para cookies/sessão e segurança.
2. **CORS**: preencher com domínio real de staging/prod, sem wildcard.
3. **Admin do smoke**: garantir usuário existente (seed/admin).
4. **Backup antes de produção**: obrigatório antes de primeira janela de go-live.
5. **Rollback testado**: validar pelo menos uma vez em staging.

## Próximo passo recomendado (primeiro ao voltar)

Executar `PRD-007` e `PRD-006`:
- backup/restore automatizado e comprovado
- runbook de rollback com teste real em staging

Isso fecha os últimos bloqueantes críticos para go-live seguro.
