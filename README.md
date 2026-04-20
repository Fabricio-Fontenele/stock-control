# Controle de Estoque da Conveniencia

API backend em TypeScript/Fastify para controle de estoque por lote, com auditoria,
autenticacao JWT, alertas de vencimento e operacoes administrativas.

## Estado Atual

- Setup, fundacao, US1, US2 e US3 implementadas.
- Fluxos administrativos cobertos:
  - gestao de produtos
  - gestao de categorias
  - gestao de fornecedores
  - relatorio de movimentacoes
  - liberacao excepcional de lote vencido
- Pendente principal restante:
  - hardening operacional de seguranca e logging

## Comandos

```bash
npm install
npm run build
npm run test:unit
npm test
```

## Banco Local

```bash
npm run db:up
npm run db:migrate
npm run db:seed:admin
```

Credenciais padrao de desenvolvimento:

- `admin@conveniencia.local` / `admin123`

## Endpoints Principais

- `POST /auth/login`
- `GET /products`
- `POST /products`
- `GET /products/:productId`
- `PATCH /products/:productId`
- `POST /products/:productId/deactivate`
- `GET /categories`
- `POST /categories`
- `PATCH /categories/:categoryId`
- `GET /suppliers`
- `POST /suppliers`
- `PATCH /suppliers/:supplierId`
- `GET /inventory/stock`
- `POST /inventory/exits`
- `POST /inventory/entries`
- `POST /inventory/adjustments`
- `POST /inventory/expired-release`
- `GET /dashboard/alerts`
- `GET /reports/movements`

## Observacoes de Seguranca

- `JWT_SECRET` default e seed com senha padrao servem apenas para desenvolvimento.
- Antes de qualquer ambiente compartilhado, configure segredo JWT explicito e senha
  administrativa nao padrao.
