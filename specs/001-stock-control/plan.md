# Implementation Plan: Controle de Estoque da Conveniencia

**Branch**: `001-stock-control` | **Date**: 2026-04-19 | **Spec**: [spec.md](/home/fabricio/Documentos/portifolio/stoque-controll-convenience/specs/001-stock-control/spec.md)
**Input**: Feature specification from `/specs/001-stock-control/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Construir uma API de controle de estoque para a conveniencia de um posto de
gasolina, com cadastro de produtos, controle por lotes e validade, movimentacoes
auditaveis de entrada e saida, alertas de estoque minimo e consultas gerenciais.
A implementacao usara Fastify como interface HTTP, PostgreSQL em Docker para
persistencia transacional, Zod para validacao de contratos, JWT para autenticacao
e autorizacao por perfil, e uma organizacao em camadas para manter regras de
estoque no dominio e orquestracao nos casos de uso.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript on Node.js 22 LTS  
**Primary Dependencies**: Fastify, Zod, Fastify JWT, bcrypt, PostgreSQL driver/query layer, Vitest  
**Storage**: PostgreSQL 16 in Docker, with relational schema for products, lots, stock movements, and users  
**Testing**: Vitest for unit, integration, and contract-oriented API tests  
**Target Platform**: Linux containers for local development and server deployment  
**Project Type**: Layered web-service backend API  
**Performance Goals**: 95% das consultas de saldo em ate 500 ms; registro de saida comum em ate 20 s para o usuario; relatorios gerenciais filtrados em ate 60 s de uso percebido  
**Constraints**: Saldo negativo proibido; FEFO obrigatorio para lotes elegiveis; lote vencido bloqueado salvo liberacao administrativa auditavel; JWT com papeis Admin e Funcionario; PostgreSQL executado em ambiente Docker  
**Scale/Scope**: Operacao de uma conveniencia por implantacao, com catalogo de centenas a poucos milhares de produtos e historico crescente de movimentacoes auditaveis

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Domain model explicitly names the affected entities, value objects, and
  invariants for product, category, supplier, stock movement, expiration, and
  minimum-stock behavior.
- Use cases are mapped to the application layer with clear inputs, outputs, and
  orchestration responsibilities.
- Business rules for entry, exit, expiration, and stock-threshold decisions stay
  in domain or application code, not in interface or infrastructure adapters.
- Planned dependencies point inward across domain, application, infrastructure,
  and interface layers.
- Tasks and tests cover any changed business invariant or stock movement contract.

Gate status: PASS before research. The planned stack supports the constitutional
requirements without forcing rule ownership into the web framework or persistence
layer.

## Project Structure

### Documentation (this feature)

```text
specs/001-stock-control/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── services/
│   └── policies/
├── application/
│   ├── use-cases/
│   ├── dto/
│   └── ports/
├── infrastructure/
│   ├── persistence/
│   ├── repositories/
│   ├── security/
│   └── config/
└── interface/
    ├── api/
    │   ├── routes/
    │   ├── schemas/
    │   └── plugins/
    └── presenters/

tests/
├── unit/
│   ├── domain/
│   └── application/
├── integration/
│   ├── persistence/
│   └── api/
└── contract/
```

**Structure Decision**: single backend service with strict Clean Architecture
boundaries. Fastify lives under `src/interface/api`, authentication and database
adapters live under `src/infrastructure`, use cases under `src/application`, and
all stock invariants remain in `src/domain`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
