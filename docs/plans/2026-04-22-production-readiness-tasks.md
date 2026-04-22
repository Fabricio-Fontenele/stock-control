# Production Readiness Tasks - Fast Start

## Como usar

- Status inicial: `[ ]`
- Mover para `[x]` quando concluido
- Prioridade: `P0` (bloqueante), `P1` (necessario), `P2` (melhoria)

## Sprint 0 (48h) - Bloqueantes de go-live

- [ ] PRD-001 (P0) Definir dominios oficiais de `staging` e `production` para web e API.
  - Entrega: documento curto com URLs finais.
  - Dependencia: nenhuma.

- [ ] PRD-002 (P0) Provisionar segredos reais em ambiente (nao em arquivo versionado).
  - Escopo: `JWT_SECRET`, `WEB_SESSION_SECRET`, `DATABASE_URL` e similares.
  - Entrega: segredos configurados no provedor + evidencia de leitura em runtime.
  - Dependencia: PRD-001.

- [x] PRD-003 (P0) Restringir CORS da API para dominios oficiais.
  - Arquivos alvo: `src/app.ts` e/ou plugins de API.
  - Entrega: requests fora de origem permitida bloqueados.
  - Dependencia: PRD-001.

- [x] PRD-004 (P0) Validar obrigatoriedade de env na inicializacao da API e Web.
  - Arquivos alvo: `src/infrastructure/config/env.ts` e config equivalente no web.
  - Entrega: falha rapida com mensagem clara quando faltar env critica.
  - Dependencia: PRD-002.

- [x] PRD-005 (P0) Criar workflow de deploy para staging (build -> migrate -> start -> smoke).
  - Arquivos alvo: `.github/workflows/`.
  - Entrega: deploy de staging acionavel por push/manual.
  - Dependencia: PRD-002, PRD-004.

- [ ] PRD-006 (P0) Implementar script/runbook de rollback de aplicacao e banco.
  - Arquivos alvo: `docs/plans/` + scripts de deploy.
  - Entrega: passo a passo testado em staging.
  - Dependencia: PRD-005.

- [ ] PRD-007 (P0) Definir e executar rotina de backup pre-deploy + teste de restore.
  - Entrega: comando automatizado e comprovacao de restore em staging.
  - Dependencia: PRD-005.

- [x] PRD-008 (P0) Criar smoke test pos-deploy para fluxos criticos.
  - Fluxos: login, estoque, entrada, saida, produtos, fornecedores, funcionarios.
  - Entrega: comando unico com resultado pass/fail.
  - Dependencia: PRD-005.

## Sprint 1 - Confiabilidade operacional

- [ ] PRD-009 (P1) Expor endpoint de health e readiness na API.
  - Entrega: `/health` retornando status com checks minimos.
  - Dependencia: nenhuma.

- [ ] PRD-010 (P1) Padronizar logs estruturados com correlation/request id.
  - Entrega: logs com campos minimos (`timestamp`, `level`, `route`, `statusCode`, `requestId`).
  - Dependencia: nenhuma.

- [ ] PRD-011 (P1) Configurar monitoramento e alerta basico.
  - Entrega: alerta para indisponibilidade e erro 5xx acima de limiar.
  - Dependencia: PRD-009, PRD-010.

- [ ] PRD-012 (P1) Executar testes de contrato/integracao em ambiente com Postgres no CI.
  - Entrega: job CI separado com servico Postgres.
  - Dependencia: CI atual funcional.

- [ ] PRD-013 (P1) Definir politica de rotacao de segredo e sessao.
  - Entrega: runbook de rotacao sem downtime significativo.
  - Dependencia: PRD-002.

## Sprint 2 - Hardening e governanca

- [ ] PRD-014 (P2) Aplicar rate limit e protecoes anti-abuso nas rotas sensiveis (`/auth/login`).
  - Entrega: limite configurado + testes basicos.
  - Dependencia: PRD-003.

- [ ] PRD-015 (P2) Revisar cabecalhos de seguranca e politica de cookies em producao.
  - Entrega: checklist de seguranca HTTP aprovado.
  - Dependencia: PRD-003.

- [ ] PRD-016 (P2) Publicar runbook de incidentes operacionais.
  - Entrega: playbook com diagnostico, mitigacao e comunicacao.
  - Dependencia: PRD-006, PRD-011.

## Definicao de pronto (DoD) desta trilha

- [ ] Todos os itens `P0` concluidos.
- [ ] Pelo menos 4 itens `P1` concluidos (incluindo PRD-012).
- [ ] Deploy em staging executado sem intervencao manual critica.
- [ ] Smoke pos-deploy aprovado duas execucoes consecutivas.
- [ ] Checklist final de go-live assinado.

## Ordem sugerida para iniciar hoje

1. PRD-001
2. PRD-002
3. PRD-003
4. PRD-004
5. PRD-005
6. PRD-008
7. PRD-007
8. PRD-006
