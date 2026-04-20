# Tasks: Controle de Estoque da Conveniencia

**Input**: Design documents from `/specs/001-stock-control/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: Business-rule and use-case changes MUST include automated tests because the specification defines mandatory behavioral scenarios and invariants.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the TypeScript/Fastify service, local database tooling, and test tooling.

- [x] T001 Initialize the Node.js package manifest with runtime and dev scripts in `package.json`
- [x] T002 Configure TypeScript compiler options and path aliases in `tsconfig.json`
- [x] T003 [P] Configure Vitest for unit, integration, and contract suites in `vitest.config.ts`
- [x] T004 [P] Define local PostgreSQL services and environment wiring in `docker-compose.yml` and `.env.example`
- [x] T005 [P] Create the application entrypoints in `src/app.ts` and `src/server.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish domain contracts, persistence, security, and shared adapters required by every user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Define shared domain entities for catalog, stock, and users in `src/domain/entities/product.ts`, `src/domain/entities/category.ts`, `src/domain/entities/supplier.ts`, `src/domain/entities/stock-lot.ts`, `src/domain/entities/stock-movement.ts`, and `src/domain/entities/user.ts`
- [x] T007 [P] Implement shared stock and expiration policies in `src/domain/policies/stock-balance-policy.ts` and `src/domain/policies/expiration-policy.ts`
- [x] T008 [P] Define repository and transaction ports in `src/application/ports/product-repository.ts`, `src/application/ports/category-repository.ts`, `src/application/ports/supplier-repository.ts`, `src/application/ports/stock-repository.ts`, `src/application/ports/movement-repository.ts`, `src/application/ports/user-repository.ts`, and `src/application/ports/unit-of-work.ts`
- [x] T009 [P] Implement environment, database, and JWT configuration adapters in `src/infrastructure/config/env.ts`, `src/infrastructure/persistence/postgres/connection.ts`, and `src/infrastructure/security/jwt-service.ts`
- [x] T010 Implement PostgreSQL schema and migration bootstrap for products, lots, movements, and users in `src/infrastructure/persistence/postgres/migrations/001_initial_schema.ts`
- [x] T011 Implement PostgreSQL repository adapters for catalog, stock, and users in `src/infrastructure/repositories/postgres-product-repository.ts`, `src/infrastructure/repositories/postgres-category-repository.ts`, `src/infrastructure/repositories/postgres-supplier-repository.ts`, `src/infrastructure/repositories/postgres-stock-repository.ts`, `src/infrastructure/repositories/postgres-movement-repository.ts`, and `src/infrastructure/repositories/postgres-user-repository.ts`
- [x] T012 [P] Configure Fastify plugins for auth, database access, and error handling in `src/interface/api/plugins/auth.ts`, `src/interface/api/plugins/database.ts`, and `src/interface/api/plugins/error-handler.ts`
- [x] T013 [P] Create shared Zod schemas and presenters for auth, products, inventory, and reports in `src/interface/api/schemas/auth-schemas.ts`, `src/interface/api/schemas/product-schemas.ts`, `src/interface/api/schemas/inventory-schemas.ts`, `src/interface/api/schemas/report-schemas.ts`, and `src/interface/presenters/http-presenters.ts`
- [x] T014 Implement authenticated user seeding and password hashing support in `src/infrastructure/security/password-hasher.ts` and `src/infrastructure/persistence/postgres/seed-admin.ts`
- [x] T043 [P] Add movement-immutability tests that verify domain/application rule ownership and blocked deletion in `tests/unit/domain/stock-movement-immutability.spec.ts`, `tests/unit/application/stock-movement-immutability.spec.ts`, and `tests/integration/api/stock-movement-immutability.spec.ts`
- [x] T044 Implement authoritative movement-immutability rule in domain/application with repository and API safeguards as secondary defenses in `src/domain/policies/stock-movement-immutability-policy.ts`, `src/application/use-cases/delete-stock-movement.use-case.ts`, `src/infrastructure/repositories/postgres-movement-repository.ts`, `src/interface/api/routes/inventory-routes.ts`, and `src/interface/api/plugins/error-handler.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Consultar saldo e registrar saida rapida (Priority: P1) 🎯 MVP

**Goal**: Allow an authenticated employee to search products, inspect eligible stock, and register a fast exit with FEFO, negative-stock blocking, and auditability.

**Independent Test**: An `employee` logs in, searches by SKU or name, sees the current stock snapshot, registers a `sale` exit that consumes the nearest-expiring eligible lot, and receives a rejection when stock is insufficient or the lot is expired.

### Tests for User Story 1 ⚠️

- [x] T015 [P] [US1] Add domain tests for FEFO selection, expired-lot blocking, and negative-stock prevention in `tests/unit/domain/stock-balance-policy.spec.ts`
- [x] T016 [P] [US1] Add application tests for fast stock search and quick-exit orchestration, including rejected-attempt audit logging assertions, in `tests/unit/application/register-quick-exit.use-case.spec.ts` and `tests/unit/application/search-stock.use-case.spec.ts`
- [x] T017 [P] [US1] Add API contract and integration tests for `/auth/login`, `/inventory/stock`, and `/inventory/exits`, covering `sale`, `loss`, `expired`, and `breakage` operations, in `tests/contract/auth-login.contract.spec.ts`, `tests/contract/inventory-stock.contract.spec.ts`, `tests/contract/inventory-exits.contract.spec.ts`, and `tests/integration/api/quick-exit-flow.spec.ts`

### Implementation for User Story 1

- [x] T018 [P] [US1] Implement login and role-aware auth use cases in `src/application/use-cases/login.use-case.ts` and `src/application/dto/auth-dto.ts`
- [x] T019 [P] [US1] Implement stock search and product snapshot querying in `src/application/use-cases/search-stock.use-case.ts` and `src/application/dto/product-stock-snapshot.ts`
- [x] T020 [US1] Implement quick-exit orchestration with FEFO, audit trail (including rejected attempts), and permission checks in `src/application/use-cases/register-quick-exit.use-case.ts`
- [x] T021 [US1] Extend stock and movement repositories for eligible-lot selection and immutable exit persistence in `src/infrastructure/repositories/postgres-stock-repository.ts` and `src/infrastructure/repositories/postgres-movement-repository.ts`
- [x] T022 [US1] Implement auth and inventory HTTP routes for login, stock search, and quick exits in `src/interface/api/routes/auth-routes.ts` and `src/interface/api/routes/inventory-routes.ts`
- [x] T023 [US1] Wire the MVP routes into the Fastify app in `src/app.ts`

**Checkpoint**: User Story 1 is independently functional and can be demoed as the MVP

---

## Phase 4: User Story 2 - Receber produtos por lote e controlar validade (Priority: P2)

**Goal**: Allow an admin to register inventory entries by lot, maintain expiration metadata, and surface alert views for expired and expiring lots.

**Independent Test**: An `admin` registers an entry with quantity, origin, entry date, and expiration date, then verifies the updated stock and sees lots classified as expired or expiring within 15 days in the alerts view.

### Tests for User Story 2 ⚠️

- [x] T024 [P] [US2] Add domain tests for lot creation, required expiration fields, and 15-day expiration classification in `tests/unit/domain/expiration-policy.spec.ts` and `tests/unit/domain/stock-lot.spec.ts`
- [x] T025 [P] [US2] Add application tests for registering stock entries and querying alerts in `tests/unit/application/register-stock-entry.use-case.spec.ts` and `tests/unit/application/get-dashboard-alerts.use-case.spec.ts`
- [x] T026 [P] [US2] Add API contract and integration tests for `/inventory/entries` and `/dashboard/alerts` in `tests/contract/inventory-entries.contract.spec.ts`, `tests/contract/dashboard-alerts.contract.spec.ts`, and `tests/integration/api/stock-entry-alerts-flow.spec.ts`
- [x] T050 [P] [US2] Add domain, application, and API tests for Admin-only inventory adjustment with explicit direction (`entrada`/`saida`), required reason, and negative-stock blocking on `saida` in `tests/unit/domain/stock-balance-policy.spec.ts`, `tests/unit/application/register-inventory-adjustment.use-case.spec.ts`, `tests/contract/inventory-adjustments.contract.spec.ts`, and `tests/integration/api/inventory-adjustments-flow.spec.ts`

### Implementation for User Story 2

- [x] T027 [P] [US2] Implement stock-entry DTOs and admin-only entry registration in `src/application/dto/stock-entry-dto.ts` and `src/application/use-cases/register-stock-entry.use-case.ts`
- [x] T028 [P] [US2] Implement expiration-aware alert aggregation in `src/application/use-cases/get-dashboard-alerts.use-case.ts`
- [x] T029 [US2] Extend persistence for lot creation, entry transactions, and alert queries in `src/infrastructure/repositories/postgres-stock-repository.ts` and `src/infrastructure/repositories/postgres-movement-repository.ts`
- [x] T030 [US2] Implement inventory entry and dashboard alert handlers in `src/interface/api/routes/inventory-routes.ts` and `src/interface/api/routes/dashboard-routes.ts`
- [x] T031 [US2] Update Zod schemas and presenters for lot entry and alert responses in `src/interface/api/schemas/inventory-schemas.ts`, `src/interface/api/schemas/report-schemas.ts`, and `src/interface/presenters/http-presenters.ts`
- [x] T045 [P] [US2] Add API authorization tests to block `employee` inventory adjustments in `tests/contract/inventory-adjustments-authorization.contract.spec.ts` and `tests/integration/api/inventory-adjustments-authorization.spec.ts`
- [x] T046 [US2] Implement explicit Admin-only authorization guard for inventory adjustments in `src/application/use-cases/register-inventory-adjustment.use-case.ts` and `src/interface/api/routes/inventory-routes.ts`
- [x] T051 [US2] Implement Admin-only inventory adjustment use case with explicit direction (`entrada`/`saida`), required reason, and audit trail in `src/application/dto/inventory-adjustment-dto.ts` and `src/application/use-cases/register-inventory-adjustment.use-case.ts`
- [x] T052 [US2] Implement inventory adjustment persistence, schema, and route wiring in `src/infrastructure/repositories/postgres-movement-repository.ts`, `src/interface/api/schemas/inventory-schemas.ts`, and `src/interface/api/routes/inventory-routes.ts`

**Checkpoint**: User Stories 1 and 2 both work independently, including lot-aware stock control

---

## Phase 5: User Story 3 - Gerenciar cadastro, auditoria e reposicao (Priority: P3)

**Goal**: Allow an admin to manage the product catalog, view movement reports, track low-stock and expiration risks, and authorize exceptional expired-lot usage.

**Independent Test**: An `admin` creates or updates catalog data, deactivates a product without losing history, reviews movement reports filtered by period, sees low-stock and expiration panels, and approves an exceptional expired-lot release with its own audit trail.

### Tests for User Story 3 ⚠️

- [x] T032 [P] [US3] Add domain tests for permanent SKU uniqueness, inactive-product restrictions, and expired-release authorization in `tests/unit/domain/product.spec.ts` and `tests/unit/domain/stock-movement.spec.ts`
- [x] T033 [P] [US3] Add application tests for product management, movement reports, and expired-release approval in `tests/unit/application/manage-product.use-case.spec.ts`, `tests/unit/application/list-movements-report.use-case.spec.ts`, and `tests/unit/application/approve-expired-release.use-case.spec.ts`
- [x] T034 [P] [US3] Add API contract and integration tests for `/products`, `/products/{productId}`, `/products/{productId}/deactivate`, `/reports/movements`, and `/inventory/expired-release` in `tests/contract/products.contract.spec.ts`, `tests/contract/product-detail.contract.spec.ts`, `tests/contract/reports-movements.contract.spec.ts`, `tests/contract/inventory-expired-release.contract.spec.ts`, and `tests/integration/api/admin-management-flow.spec.ts`

### Implementation for User Story 3

- [x] T035 [P] [US3] Implement product management use cases for create, update, list, detail, and deactivate flows in `src/application/use-cases/create-product.use-case.ts`, `src/application/use-cases/update-product.use-case.ts`, `src/application/use-cases/list-products.use-case.ts`, `src/application/use-cases/get-product-detail.use-case.ts`, and `src/application/use-cases/deactivate-product.use-case.ts`
- [x] T036 [P] [US3] Implement reporting and expired-release approval use cases in `src/application/use-cases/list-movements-report.use-case.ts` and `src/application/use-cases/approve-expired-release.use-case.ts`
- [x] T037 [US3] Extend repository adapters for SKU reservation, product filters, movement report queries, and expired-release persistence in `src/infrastructure/repositories/postgres-product-repository.ts`, `src/infrastructure/repositories/postgres-movement-repository.ts`, and `src/infrastructure/repositories/postgres-stock-repository.ts`
- [x] T038 [US3] Implement product, reporting, and expired-release HTTP routes in `src/interface/api/routes/product-routes.ts`, `src/interface/api/routes/report-routes.ts`, and `src/interface/api/routes/inventory-routes.ts`
- [x] T039 [US3] Wire product, dashboard, and report routes into the application composition root in `src/app.ts`
- [x] T047 [P] [US3] Add application and API tests for category and supplier management in `tests/unit/application/manage-categories-suppliers.use-case.spec.ts`, `tests/contract/categories.contract.spec.ts`, and `tests/contract/suppliers.contract.spec.ts`
- [x] T048 [P] [US3] Implement category and supplier management use cases in `src/application/use-cases/create-category.use-case.ts`, `src/application/use-cases/update-category.use-case.ts`, `src/application/use-cases/list-categories.use-case.ts`, `src/application/use-cases/create-supplier.use-case.ts`, `src/application/use-cases/update-supplier.use-case.ts`, and `src/application/use-cases/list-suppliers.use-case.ts`
- [x] T049 [US3] Implement category and supplier HTTP routes and app wiring in `src/interface/api/routes/category-routes.ts`, `src/interface/api/routes/supplier-routes.ts`, and `src/app.ts`

**Checkpoint**: All user stories are independently functional with admin management and reporting complete

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish documentation, operational hardening, and full-scenario validation across stories.

- [ ] T040 [P] Add request logging, security headers, and JWT error hardening in `src/interface/api/plugins/error-handler.ts` and `src/app.ts`
- [x] T041 [P] Document local setup, seed flow, and API usage in `README.md`
- [x] T042 Run the end-to-end quickstart validation and record any missing setup details in `specs/001-stock-control/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** has no dependencies and starts immediately.
- **Phase 2: Foundational** depends on Phase 1 and blocks every user story.
- **Phase 3: US1** depends on Phase 2 and is the recommended MVP.
- **Phase 4: US2** depends on Phase 2 and can proceed in parallel with US1 after the foundation is complete.
- **Phase 5: US3** depends on Phase 2 and can proceed in parallel with US1 and US2 after the foundation is complete.
- **Phase 6: Polish** depends on the stories you want to ship.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories after the foundational phase.
- **US2 (P2)**: No dependency on US1, but it reuses the same foundation and shared stock repositories.
- **US3 (P3)**: No dependency on US1 or US2 for implementation order, but it benefits from the shared inventory and auth infrastructure built in Phase 2.

### Within Each User Story

- Automated tests must be written before implementation and should fail first.
- Domain policies and DTO contracts precede orchestration logic.
- Use cases precede interface routes and presenters.
- Repository adapters must satisfy application ports without moving business rules out of domain/application layers.

### Suggested Completion Order

- Finish Phase 1 and Phase 2.
- Deliver **US1** as the MVP.
- Add **US2** for lot-aware receiving and expiration control.
- Add **US3** for full catalog management, reporting, and exceptional admin flows.

---

## Parallel Opportunities

- `T003`, `T004`, and `T005` can run in parallel once `package.json` and `tsconfig.json` decisions are known.
- `T007`, `T008`, `T009`, `T012`, `T013`, `T014`, and `T043` can run in parallel during the foundational phase after the entity definitions begin stabilizing.
- For **US1**, `T015`, `T016`, and `T017` can run in parallel, followed by `T018` and `T019`.
- For **US2**, `T024`, `T025`, `T026`, `T045`, and `T050` can run in parallel, followed by `T027`, `T028`, and `T051`.
- For **US3**, `T032`, `T033`, `T034`, and `T047` can run in parallel, followed by `T035`, `T036`, and `T048`.
- `T040` and `T041` can run in parallel during the polish phase.

---

## Parallel Example: User Story 1

```bash
Task: "Add domain tests for FEFO selection, expired-lot blocking, and negative-stock prevention in tests/unit/domain/stock-balance-policy.spec.ts"
Task: "Add application tests for fast stock search and quick-exit orchestration in tests/unit/application/register-quick-exit.use-case.spec.ts and tests/unit/application/search-stock.use-case.spec.ts"
Task: "Add API contract and integration tests for /auth/login, /inventory/stock, and /inventory/exits in tests/contract/auth-login.contract.spec.ts, tests/contract/inventory-stock.contract.spec.ts, tests/contract/inventory-exits.contract.spec.ts, and tests/integration/api/quick-exit-flow.spec.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Add domain tests for lot creation, required expiration fields, and 15-day expiration classification in tests/unit/domain/expiration-policy.spec.ts and tests/unit/domain/stock-lot.spec.ts"
Task: "Add application tests for registering stock entries and querying alerts in tests/unit/application/register-stock-entry.use-case.spec.ts and tests/unit/application/get-dashboard-alerts.use-case.spec.ts"
Task: "Add API contract and integration tests for /inventory/entries and /dashboard/alerts in tests/contract/inventory-entries.contract.spec.ts, tests/contract/dashboard-alerts.contract.spec.ts, and tests/integration/api/stock-entry-alerts-flow.spec.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Implement product management use cases for create, update, list, detail, and deactivate flows in src/application/use-cases/create-product.use-case.ts, src/application/use-cases/update-product.use-case.ts, src/application/use-cases/list-products.use-case.ts, src/application/use-cases/get-product-detail.use-case.ts, and src/application/use-cases/deactivate-product.use-case.ts"
Task: "Implement reporting and expired-release approval use cases in src/application/use-cases/list-movements-report.use-case.ts and src/application/use-cases/approve-expired-release.use-case.ts"
Task: "Extend repository adapters for SKU reservation, product filters, movement report queries, and expired-release persistence in src/infrastructure/repositories/postgres-product-repository.ts, src/infrastructure/repositories/postgres-movement-repository.ts, and src/infrastructure/repositories/postgres-stock-repository.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate login, stock search, FEFO exits, and negative-stock blocking before expanding scope

### Incremental Delivery

1. Setup + Foundation establish the backend skeleton and cross-cutting adapters
2. US1 delivers the primary operational workflow for the convenience staff
3. US2 adds lot receiving and expiration monitoring
4. US3 completes catalog administration, reporting, and exceptional audit flows

### Parallel Team Strategy

1. One developer finalizes persistence and auth foundation after Phase 1
2. A second developer can start US1 tests while the foundation stabilizes
3. After Phase 2, separate developers can own US1, US2, and US3 concurrently with low file overlap

---

## Notes

- All tasks follow the required checklist format: checkbox, task ID, optional `[P]`, required story label for story phases, and exact file paths.
- User stories remain independently testable because their tests and implementation tasks are scoped to their own endpoints and use cases.
- The suggested MVP scope is **User Story 1** because it delivers the core operational value with the smallest surface area.
