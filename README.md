# Controle de Estoque da Conveniencia

API backend em TypeScript/Fastify para controle de estoque por lote, com auditoria,
autenticacao JWT, alertas de vencimento e operacoes administrativas.

Frontend web em Next 15 + Tailwind 4 em `apps/web`, com sessao por cookie
HTTP-only e foco em operacao + administracao.

## Estado Atual

- Setup, fundacao, US1, US2, US3 e hardening operacional implementados.
- Fluxos administrativos cobertos:
  - gestao de produtos
  - gestao de categorias
  - gestao de fornecedores
  - relatorio de movimentacoes
  - liberacao excepcional de lote vencido
- Endurecimento operacional aplicado:
  - logging explicito de request/response
  - headers de seguranca nas respostas HTTP
  - respostas JWT endurecidas para token ausente, invalido ou expirado
- Frontend MVP em andamento:
  - login e sessao protegida no Next
  - estoque como fluxo principal de operacao, com listagem inicial, filtro, ordenacao, paginacao leve e clique no produto para registrar saida
  - alertas administrativos
  - categorias, fornecedores, catalogo em tabela com ordenacao por coluna e entradas por lote
  - refinamentos de UX para estados vazios, toasts de feedback e navegacao operacional
  - cadastro de produto com SKU numerico sugerido automaticamente sem consumir a sequencia, ainda editavel, fornecedor opcional, unidade selecionavel, calculo bidirecional entre margem e preco final e reativacao de produto inativo

## Comandos

```bash
npm install
npm run build
npm run test:unit
npm test
```

## Frontend Web

```bash
cd apps/web
npm install
npm run build
```

Variaveis de ambiente do frontend:

- `STOCK_CONTROL_API_URL=http://localhost:3000`
- `WEB_SESSION_SECRET=change-me-in-shared-environments`

Fluxos ja implementados no frontend:

- `login`
- `estoque`
- `estoque/saida`
- `alertas`
- `categorias`
- `fornecedores`
- `catalogo` (`/produtos`)
- `entradas`

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
- `POST /products/:productId/reactivate`
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
