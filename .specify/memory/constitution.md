<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template Principle 1 -> I. Ubiquitous Inventory Language
- Template Principle 2 -> II. Domain-Centered Business Rules
- Template Principle 3 -> III. Clean Architecture Boundaries
- Template Principle 4 -> IV. Single Source of Behavioral Truth
- Template Principle 5 -> V. SOLID Use Cases and Verifiable Contracts
Added sections:
- Operational Boundaries
- Delivery Workflow
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ⚠ pending: .specify/templates/commands/*.md (directory not present in repository)
Follow-up TODOs:
- None
-->
# Estoque Convenience Constitution

## Core Principles

### I. Ubiquitous Inventory Language
Every specification, plan, task, and code artifact MUST use names grounded in the
inventory domain. Product, category, supplier, stock movement, batch, expiration
date, available quantity, reserved quantity, and minimum stock are the preferred
terms when they express the business meaning. Generic names such as `Manager`,
`Helper`, `Data`, or `Process` MUST NOT represent domain concepts.

Rationale: clean names reduce ambiguity, preserve business intent, and keep the
model aligned with real convenience-store operations.

### II. Domain-Centered Business Rules
Rules for stock entry, stock exit, expiration handling, and minimum-stock control
MUST live in the domain model through entities, value objects, domain services, or
policies with explicit names. Interface adapters, controllers, persistence models,
and framework code MUST NOT decide whether a movement is valid, whether stock can
leave inventory, or when an item is below its replenishment threshold.

Rationale: inventory correctness depends on consistent invariants, and those
invariants are part of the business, not the transport or storage mechanism.

### III. Clean Architecture Boundaries
The solution MUST be organized into domain, application, infrastructure, and
interface layers. Dependencies MUST point inward: interface depends on
application, application depends on domain abstractions and rules, infrastructure
implements ports defined by the inner layers, and the domain remains free from
framework details. Each use case MUST declare its input, orchestration, and output
explicitly.

Rationale: stable boundaries let the business evolve without coupling core rules
to delivery channels, databases, or vendor choices.

### IV. Single Source of Behavioral Truth
Each business rule MUST have one authoritative implementation. Validation for
stock depletion, expiration eligibility, replenishment threshold calculation, and
movement classification MUST NOT be duplicated across controllers, repositories,
jobs, or UI layers. Shared behavior MUST be extracted into named domain objects or
application policies instead of copied conditionals.

Rationale: duplicated rules drift quickly in inventory systems and create silent
stock inconsistencies that are expensive to detect after the fact.

### V. SOLID Use Cases and Verifiable Contracts
Each use case MUST have a single business responsibility and MUST depend on
abstractions that describe business needs, not infrastructure details. Interfaces
MUST stay narrow and purposeful. Any change to critical inventory behavior MUST be
covered by automated tests that verify domain invariants and application flow,
especially for entry, exit, expiration, and minimum-stock outcomes.

Rationale: SOLID boundaries keep behavior composable and testable, while verified
contracts protect the system against regressions in the most sensitive stock rules.

## Operational Boundaries

- `Product` MUST own identity, commercial description, category association,
  supplier association, stock policy, and the rule of whether expiration tracking
  applies.
- `Category` MUST classify products and may provide commercial or replenishment
  defaults, but it MUST NOT own mutable stock quantities.
- `Supplier` MUST represent the sourcing partner and procurement metadata relevant
  to replenishment and traceability.
- `StockMovement` MUST be an immutable business record with type, quantity,
  timestamp, justification, and references to the affected product and, when
  applicable, batch or expiration information.
- Stock entry MUST increase available inventory only through an explicit inbound
  use case that validates product identity, quantity, and expiration policy.
- Stock exit MUST decrease available inventory only through an explicit outbound
  use case and MUST prevent negative available stock unless the movement is a
  separately modeled authorized adjustment.
- Products with expiration control MUST track batch or equivalent expiration
  reference, and outbound allocation MUST respect the chosen business policy for
  eligible stock rotation.
- Minimum stock MUST be derived from a clear business rule attached to the product
  or category policy, and any breach MUST be observable through an explicit
  application outcome such as alert generation, replenishment recommendation, or
  dashboard status.

## Delivery Workflow

- Specifications MUST describe the domain model explicitly, including entities,
  invariants, and the use cases that change stock state.
- Implementation plans MUST document how each feature preserves the architecture
  boundary between domain, application, infrastructure, and interface.
- Task breakdowns MUST map work to concrete files in those layers and MUST call
  out tests for business-rule changes.
- Any deliberate boundary violation, temporary coupling, or rule duplication MUST
  be recorded in the plan's Complexity Tracking section with a domain-based
  justification and an exit strategy.
- Code review and analysis activities MUST treat constitution violations as
  blocking issues until the specification, plan, tasks, or implementation are
  brought back into compliance.

## Governance

This constitution supersedes local preferences when they conflict with domain
clarity, inventory correctness, or architectural separation. Amendments MUST be
made through an explicit constitution update that documents the affected
principles, the reason for change, and the required template or workflow updates.

Versioning policy follows semantic versioning for governance:
- MAJOR for removed or redefined principles that change compliance obligations.
- MINOR for new principles, new mandatory sections, or materially expanded rules.
- PATCH for clarifications that do not alter compliance expectations.

Compliance review is mandatory for every specification, implementation plan, task
list, and code review. Reviewers MUST verify that domain vocabulary is explicit,
inventory invariants remain centralized, and architectural dependencies still
point inward.

**Version**: 1.0.0 | **Ratified**: 2026-04-19 | **Last Amended**: 2026-04-19
