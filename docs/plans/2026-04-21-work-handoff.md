# Handoff da Jornada - 2026-04-21

## Contexto

Esta jornada consolidou o MVP web em `apps/web` e concluiu ajustes de contrato
e comportamento na API para manter consistencia entre operacao e administracao.

## Entregas Backend

- Produto com `supplierId` opcional.
- SKU numerico sequencial gerado automaticamente, com preview sem consumo de
  sequencia e possibilidade de edicao manual no formulario.
- Sincronizacao da sequencia ao usar SKU manual numerico para evitar colisao.
- Rota de reativacao de produto:
  - `POST /products/:productId/reactivate`
- Busca de estoque expandida para suportar listagem operacional completa com
  campos adicionais para UI tabular.
- Contrato OpenAPI atualizado para refletir endpoints e payloads novos.
- Cobertura de testes unitarios e de contrato atualizada para os novos fluxos.

## Entregas Frontend

- App Next 15 + Tailwind 4 em `apps/web`.
- Sessao com cookie HTTP-only assinado, login/logout e guardas de acesso.
- Fluxo operacional principal em `Estoque`:
  - listagem inicial de produtos
  - filtro por SKU/nome
  - ordenacao por coluna
  - paginacao leve
  - clique na linha para ir para saida com produto preselecionado
- Fluxo administrativo:
  - `Catalogo` em tabela (substituindo rotulo "Produtos" na navegacao)
  - criacao/edicao/desativacao/reativacao de produtos
  - categorias e fornecedores com criacao/atualizacao
  - entradas por lote
- UX refinada com estados vazios e toasts de feedback administrativos.

## Validacao Executada

- Backend:
  - `npm run build`
  - `npm run test:unit`
- Frontend:
  - `cd apps/web && npm run build`

## Riscos e Observacoes

- Toasts estao simples (sem fila/deduplicacao), adequados para MVP.
- Testes de contrato/integracao dependem do Postgres local do ambiente.
- Existem diretorios locais de skills em `.agents/skills/*` nao relacionados ao
  produto e propositalmente fora dos commits desta jornada.

## Proxima Jornada Recomendada

1. Cobrir o frontend com smoke tests dos fluxos criticos (login, estoque,
   saida, catalogo, entradas).
2. Revisar feedback de erro por campo nos formularios administrativos.
3. Avaliar uma estrategia de toast centralizada (fila e deduplicacao) se o uso
   simultaneo de acoes crescer.
4. Planejar a fase seguinte de escopo: ajustes, relatorios e lote vencido no
   frontend.
