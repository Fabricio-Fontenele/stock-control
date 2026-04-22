# Production Readiness Plan - Stock Control

## Contexto

O produto esta funcional para uso interno, mas ainda faltam garantias operacionais para producao (seguranca, deploy confiavel, observabilidade, validacao em ambiente real e governanca de banco).

Este plano organiza o caminho para go-live com risco controlado e tempo de execucao curto.

## Objetivo

Levar o sistema para um estado "go-live ready" com:
- configuracao segura de ambiente;
- pipeline CI/CD minima confiavel;
- deploy com migracao de banco e rollback;
- observabilidade basica de operacao;
- validacao funcional em staging;
- checklist final de liberacao.

## Escopo desta fase

- Backend API (Fastify/Node/Postgres)
- Frontend Web (Next.js)
- Banco Postgres (migracoes e backup)
- Infra de deploy e configuracoes de ambiente

## Fora de escopo (neste ciclo)

- Otimizacoes de performance avancadas
- Refatoracoes grandes de arquitetura
- Novas features de produto

## Criterios de Pronto para Producao

1. Segredos de producao configurados fora do repositorio e validados.
2. CORS restrito para dominios oficiais do frontend.
3. CI obrigatorio para PR com build backend, testes unitarios e build web.
4. Deploy automatizado com etapa de migracao e verificacao pos-deploy.
5. Backup de banco automatizado + teste de restore documentado.
6. Healthcheck e logs estruturados ativos em ambiente.
7. Smoke test de staging aprovado (login, estoque, entradas, saidas, catalogo, fornecedores, funcionarios).
8. Runbook de incidentes e rollback publicado.

## Riscos principais e mitigacoes

- Migracao quebrar dados: executar backup pre-deploy e migracao transacional com janela definida.
- Configuracao incorreta de segredos: checklist de variaveis obrigatorias e validacao na inicializacao.
- Regressao de fluxo critico: smoke automatizado pos-deploy + checklist manual.
- Falha de infraestrutura: plano de rollback versionado e testado em staging.

## Estrategia de rollout

1. Preparar staging identico a producao (exceto volume de dados).
2. Executar deploy completo em staging.
3. Rodar smoke + validacao manual guiada.
4. Criar janela curta de deploy em producao.
5. Executar backup, deploy, migracao e smoke pos-deploy.
6. Monitorar 30-60 min com criterio de rollback definido.

## Estrategia de rollback

- Aplicacao: rollback para imagem/commit anterior.
- Banco:
  - se migracao reversivel: executar down script controlado;
  - se nao reversivel: restaurar snapshot/backup pre-deploy.
- Comunicar incidente e registrar timeline no runbook.

## Ambiente e configuracoes obrigatorias

### Backend
- NODE_ENV=production
- PORT
- DATABASE_URL
- JWT_SECRET (forte, rotacionavel)
- JWT_EXPIRES_IN

### Web
- STOCK_CONTROL_API_URL (URL da API publica/interna correta)
- NEXT_PUBLIC_STOCK_CONTROL_API_URL (quando necessario)
- WEB_SESSION_SECRET (forte, rotacionavel)

## Observabilidade minima

- Endpoint de health (`/health` ou equivalente)
- Logs estruturados com correlacao de request
- Captura de erros da API e do web server
- Alerta basico (queda de servico / taxa de erro alta)

## Evidencias esperadas para aprovar go-live

- CI verde em PR e branch principal
- Relatorio de smoke em staging
- Registro de backup e teste de restore
- Checklist de seguranca preenchido
- Runbook publicado e revisado

## Ordem de execucao recomendada (fast track)

1. Segredos + hardening de ambiente
2. Staging + deploy automatizado
3. Migracoes + backup/restore
4. Smoke e checklist operacional
5. Go-live supervisionado
