# VPS Staging Deploy Runbook (Docker Compose)

## Objetivo

Executar deploy automatizado de staging usando GitHub Actions + VPS com Docker Compose.

## Arquivos de referencia

- Workflow: `.github/workflows/deploy-staging-vps.yml`
- Compose: `docker-compose.staging.yml`
- Exemplo de env: `.env.staging.example`
- Imagens:
  - `ghcr.io/<owner>/stock-control-api:<sha>`
  - `ghcr.io/<owner>/stock-control-web:<sha>`

## Pre-requisitos na VPS

1. Docker Engine e Docker Compose plugin instalados.
2. Usuario de deploy com permissao para executar Docker.
3. Diretorio de deploy criado (ex: `/opt/stock-control/staging`).
4. Portas liberadas no firewall:
   - `3000` (web)
   - `3333` (api), se necessario acesso externo direto
5. DNS/reverse-proxy configurado (recomendado) para dominio de staging.

## Secrets obrigatorios no GitHub (repo)

- `VPS_HOST`: IP ou host da VPS.
- `VPS_USER`: usuario SSH.
- `VPS_SSH_KEY`: chave privada SSH do deploy.
- `VPS_PORT`: porta SSH (opcional, default 22).
- `VPS_DEPLOY_PATH`: caminho remoto de deploy (ex: `/opt/stock-control/staging`).
- `STAGING_ENV_FILE`: conteudo completo do arquivo `.env.staging`.
- `STAGING_BASE_URL`: URL publica do staging web (ex: `https://staging-app.example.com`).
- `STAGING_ADMIN_EMAIL`: usuario admin usado no smoke pos-deploy.
- `STAGING_ADMIN_PASSWORD`: senha admin usada no smoke pos-deploy.

## Conteudo sugerido para `STAGING_ENV_FILE`

Use como base `.env.staging.example`:

```env
API_PORT=3333
WEB_PORT=3000

DATABASE_NAME=stock_control
DATABASE_USER=replace_with_db_user
DATABASE_PASSWORD=replace_with_db_password

JWT_SECRET=replace_with_strong_random_secret
JWT_EXPIRES_IN=8h
CORS_ALLOWED_ORIGINS=https://staging-app.example.com

WEB_SESSION_SECRET=replace_with_strong_random_secret_min_32_chars
NEXT_PUBLIC_STOCK_CONTROL_API_URL=https://staging-api.example.com
```

## Fluxo do workflow

1. Build/push da imagem da API para GHCR.
2. Build/push da imagem da Web para GHCR.
3. Cópia de `docker-compose.staging.yml` para a VPS.
4. Escrita de `.env.staging` na VPS via secret.
5. Pull das imagens no host remoto.
6. Subida do Postgres.
7. Execucao de migracoes (`node dist/.../migrate.js`).
8. Subida/atualizacao de API e Web.
9. Execucao automatica de smoke web:
   - login
   - `/estoque`
   - `/estoque/saida`
   - `/entradas`
   - `/produtos`
   - `/fornecedores`
   - `/funcionarios`

## Operacao manual na VPS (fallback)

```bash
cd /opt/stock-control/staging
docker compose --env-file .env.staging -f docker-compose.staging.yml pull
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d postgres
docker compose --env-file .env.staging -f docker-compose.staging.yml run --rm api node dist/infrastructure/persistence/postgres/migrate.js
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d api web
docker compose --env-file .env.staging -f docker-compose.staging.yml ps
```

## Validacao pos-deploy

1. Verificar containers `healthy/running` (`docker compose ps`).
2. Verificar `/health` da API.
3. Executar smoke funcional:
   - login
   - listagem de estoque
   - saida rapida
   - entradas (admin)
   - produtos/fornecedores/funcionarios

## Rollback rapido

1. Descobrir tag anterior funcional.
2. Ajustar `IMAGE_TAG` no shell remoto.
3. Rodar `docker compose pull` + `up -d` novamente.
4. Se erro de schema, restaurar backup pre-deploy.
