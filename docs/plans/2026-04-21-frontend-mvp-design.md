# Frontend MVP Design

Date: 2026-04-21
Status: Approved
Scope: Operacao + administracao para validacao real do sistema

## Implementation Status

Implementacao iniciada no mesmo dia do design, com os seguintes pontos ja
entregues:

- scaffold do app Next 15 em `apps/web`
- Tailwind 4 configurado
- sessao por cookie HTTP-only assinado
- login e logout no Next integrados com a API
- guardas autenticada e administrativa
- integracao de leitura para estoque e alertas
- aba de estoque refinada para listagem tabular com filtro por SKU/nome e colunas
  de unidade, quantidade e valor de venda
- tabela de estoque refinada com ordenacao e paginacao leve no frontend
- fluxo de saida reposicionado para partir da aba de estoque, reduzindo a dependencia
  do atalho de saida rapida
- CRUD basico de categorias e fornecedores
- listagem, criacao, edicao, desativacao e reativacao de produtos
- catalogo administrativo refinado para tabela com ordenacao por clique no cabecalho
- registro de entradas por lote
- fluxo de saida rapida
- refinamento de estados vazios, banners de feedback e atalhos operacionais
- refinamento de estados vazios e toasts de feedback nos fluxos administrativos
- formulario de produto com SKU numerico sequencial sugerido sem consumir a sequencia e ainda
  editavel, fornecedor opcional, unidade por selecao e calculo bidirecional entre
  preco final e margem

Pontos ainda abertos para refinamento:

- feedbacks de UX e empty states mais consistentes
- smoke tests automatizados do frontend
- expansao futura para ajustes, relatorios e lote vencido

## Objective

Construir o frontend web do sistema de controle de estoque usando Next 15 e
Tailwind 4, cobrindo os fluxos de operacao e administracao ja expostos pela API
backend existente.

O frontend deve ser utilizavel em ambiente real de validacao, com foco em:

- login seguro com sessao por cookie HTTP-only
- consulta de estoque e saida rapida para operacao
- alertas, catalogo, categorias, fornecedores e entradas para administracao

## Product Boundaries

Incluido no MVP:

- autenticacao por email e senha
- sessao protegida no Next com cookie HTTP-only
- protecao de rotas autenticadas
- dashboard inicial com navegacao por perfil
- busca de estoque
- registro de saida rapida
- visualizacao de alertas administrativos
- CRUD basico de categorias
- CRUD basico de fornecedores
- listagem, cadastro e edicao do catalogo de produtos
- registro de entradas por lote

Fora do MVP inicial:

- ajustes de inventario
- relatorios gerenciais
- liberacao de lote vencido
- gerenciamento de usuarios
- cliente OpenAPI gerado automaticamente

## Architecture

O frontend sera implementado como um novo app em `apps/web`, mantendo o backend
Fastify existente na raiz do repositorio. O backend continua como fonte de
verdade de negocio. O Next atua como borda web, sessao e apresentacao.

Decisoes principais:

- Next 15 com App Router
- Tailwind 4 para estilizacao
- abordagem server-first
- leitura priorizada em Server Components
- mutacoes por Server Actions e Route Handlers quando apropriado
- camada central `src/lib/api` para chamadas ao backend
- sessao baseada em cookie HTTP-only

## Session Model

O login do frontend envia credenciais para `POST /auth/login` da API. O Next
recebe o JWT da API e armazena esse token em cookie HTTP-only proprio.

Esse cookie nao fica acessivel via JavaScript no browser. As paginas protegidas,
Server Actions e Route Handlers leem o cookie no servidor e usam o token para
chamar a API backend.

Vantagens:

- menor exposicao de token
- protecao de rotas no servidor
- UX mais previsivel para logout e expiracao
- menor acoplamento com estado global no cliente

## Information Architecture

Rotas publicas:

- `/login`

Rotas autenticadas:

- `/`
- `/estoque`
- `/estoque/saida`
- `/alertas`
- `/produtos`
- `/produtos/novo`
- `/produtos/[productId]`
- `/categorias`
- `/fornecedores`
- `/entradas`

Agrupamento por area:

- operacao: estoque, busca rapida, saida
- administracao: alertas, catalogo, categorias, fornecedores, entradas

## UI Direction

O frontend nao deve parecer um dashboard generico. A direcao visual aprovada:

- linguagem operacional e comercial, inspirada em conveniencia/posto
- contraste claro e leitura rapida
- navegacao lateral no desktop e estrutura compacta no mobile
- busca de estoque com grande prioridade visual
- cards de alerta com peso visual forte para estoque baixo e validade

Paleta base sugerida:

- fundo creme quente
- azul petroleo para estrutura
- vermelho queimado para acoes e destaque critico
- amarelo de sinalizacao para alertas

## Integration Strategy

Endpoints do MVP:

- `POST /auth/login`
- `GET /inventory/stock`
- `POST /inventory/exits`
- `GET /dashboard/alerts`
- `GET /products`
- `POST /products`
- `GET /products/:productId`
- `PATCH /products/:productId`
- `GET /categories`
- `POST /categories`
- `PATCH /categories/:categoryId`
- `GET /suppliers`
- `POST /suppliers`
- `PATCH /suppliers/:supplierId`
- `POST /inventory/entries`

Padroes de integracao:

- uma funcao base de `fetch` com `Authorization: Bearer <token>`
- normalizacao de erros `401`, `403`, `400` e `500`
- invalidacao de sessao ao detectar token invalido/expirado
- tipos locais alinhados aos presenters existentes da API

## Frontend Modules

Estrutura inicial:

- `apps/web/src/app`
- `apps/web/src/components`
- `apps/web/src/features/auth`
- `apps/web/src/features/stock`
- `apps/web/src/features/products`
- `apps/web/src/features/categories`
- `apps/web/src/features/suppliers`
- `apps/web/src/features/entries`
- `apps/web/src/features/alerts`
- `apps/web/src/lib/api`
- `apps/web/src/lib/auth`

Responsabilidades:

- `features/*`: formularios, tabelas, mapeamentos e regras de UI
- `lib/api`: cliente backend e contratos do frontend
- `lib/auth`: cookie, sessao, guardas e logout
- `app/*`: rotas, layouts e composicao de pagina

## Validation Plan

Fluxos minimos para considerar o frontend MVP viavel:

1. usuario faz login com credenciais validas
2. usuario autenticado acessa pagina protegida
3. funcionario busca produto e registra saida rapida
4. admin consulta alertas
5. admin cadastra categoria e fornecedor
6. admin cadastra e edita produto
7. admin registra entrada por lote
8. logout remove sessao e bloqueia rotas protegidas

## Implementation Phases

### Phase 1

- scaffold do app Next 15 com Tailwind 4
- configuracao base de estilos, layout e ambiente
- cliente da API e sessao por cookie HTTP-only

### Phase 2

- login
- dashboard inicial
- busca de estoque
- saida rapida

### Phase 3

- alertas administrativos
- categorias
- fornecedores
- produtos
- entradas por lote

### Phase 4

- refinamento visual
- estados de loading/error/empty
- smoke validation dos fluxos principais

## Risks

- a API ainda nao oferece endpoint dedicado de sessao atual (`/me`)
- o frontend sera integrado manualmente ao contrato existente
- ha risco de divergencia futura entre presenters e tipos locais se a API mudar

## Recommendation

Implementar o frontend em `apps/web` sem reestruturar o backend agora. Isso
mantem o risco baixo, preserva o que ja esta pronto e permite integrar o MVP
com rapidez.
