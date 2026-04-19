# Research: Controle de Estoque da Conveniencia

## Decision 1: Fastify como framework da API

- Decision: usar Fastify para expor a API HTTP e organizar plugins de autenticacao,
  validacao e rotas.
- Rationale: combina boa performance para consultas rapidas, ciclo de plugins
  enxuto e separacao clara entre camada de interface e casos de uso.
- Alternatives considered: Express foi descartado por oferecer menos estrutura
  nativa para schemas e plugins; NestJS foi descartado por adicionar mais
  convencoes e acoplamento de framework do que o necessario para o escopo atual.

## Decision 2: PostgreSQL 16 em Docker para persistencia

- Decision: usar PostgreSQL como banco transacional principal, executado em
  ambiente Docker no desenvolvimento e homologacao local.
- Rationale: o dominio exige consistencia forte para movimentacoes, lotes,
  auditoria e restricoes de unicidade permanente de SKU. O banco relacional
  atende bem joins, filtros por periodo e controles transacionais.
- Alternatives considered: SQLite foi descartado por limitar cenarios mais
  realistas de concorrencia e operacao; MongoDB foi descartado por tornar mais
  custosa a modelagem relacional de lotes, movimentos e restricoes de integridade.

## Decision 3: Validacao de contratos com Zod

- Decision: definir schemas de entrada e saida com Zod na camada de interface.
- Rationale: Zod centraliza validacao sem empurrar regra de negocio para o
  framework, melhora a confiabilidade dos contratos HTTP e facilita reaproveitar
  DTOs entre interface e testes.
- Alternatives considered: validacoes manuais foram descartadas por duplicacao;
  JSON Schema puro foi descartado por menor ergonomia para os fluxos esperados.

## Decision 4: Autenticacao com Fastify JWT e senhas com bcrypt

- Decision: autenticar usuarios com JWT assinado pelo servidor e armazenar senhas
  com hash bcrypt.
- Rationale: o sistema precisa distinguir Admin e Funcionario em tempo de
  requisicao, com autorizacao consistente por papel. JWT atende bem esse cenario
  stateless e bcrypt protege segredos persistidos.
- Alternatives considered: sessoes em memoria foram descartadas por pior aderencia
  a deploy escalavel; armazenar senha sem hash forte e inaceitavel.

## Decision 5: Estrategia de testes com Vitest

- Decision: usar Vitest como runner unico para testes unitarios de dominio, testes
  de aplicacao, integracao com infraestrutura e contratos HTTP.
- Rationale: unifica o ecossistema TypeScript, mantem feedback rapido e cobre os
  invariantes mais sensiveis do estoque com baixa sobrecarga.
- Alternatives considered: Jest foi descartado por maior custo de configuracao no
  contexto atual; depender apenas de testes manuais violaria a constituicao.

## Decision 6: Modelagem de saldo derivado por movimentacoes e lotes

- Decision: manter saldo como resultado das movimentacoes registradas, com saldo
  remanescente por lote para suportar FEFO, bloqueio de lotes vencidos e auditoria.
- Rationale: isso preserva trilha completa, evita divergencia entre saldo agregado
  e historico e sustenta as regras esclarecidas na spec.
- Alternatives considered: atualizar apenas um contador agregado por produto foi
  descartado por perder rastreabilidade de lote e dificultar auditoria.

## Decision 7: Contrato HTTP REST para operacao e consulta

- Decision: expor endpoints REST para autenticacao, produtos, categorias,
  fornecedores, lotes, movimentacoes, dashboard e relatorios.
- Rationale: esse formato favorece uso por escritorio e pista, e simplifica testes
  de contrato, filtros por periodo e integracao futura com frontends ou clientes
  moveis internos.
- Alternatives considered: GraphQL foi descartado por adicionar flexibilidade que
  nao e necessaria para os fluxos definidos.
