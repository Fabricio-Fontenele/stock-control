# Data Model: Controle de Estoque da Conveniencia

## Product

- Purpose: representar um item comercializado ou controlado no estoque.
- Identity: `id` interno e `sku` unico permanente.
- Fields:
  - `id`
  - `sku`
  - `name`
  - `categoryId`
  - `supplierId`
  - `purchasePrice`
  - `salePrice`
  - `unitOfMeasure`
  - `minimumStock`
  - `tracksExpiration`
  - `status` (`active`, `inactive`)
  - `createdAt`
  - `updatedAt`
- Invariants:
  - `sku` nunca pode ser reutilizado.
  - produto inativo nao participa de movimentacoes comuns.
  - `minimumStock` deve ser maior ou igual a zero.
- Relationships:
  - pertence a uma `Category`
  - referencia um `Supplier`
  - possui varios `StockLot`
  - possui varias `StockMovement`

## Category

- Purpose: classificar produtos para consulta e leitura gerencial.
- Identity: `id`
- Fields:
  - `id`
  - `name`
  - `description`
  - `createdAt`
  - `updatedAt`
- Invariants:
  - nome deve ser unico no contexto da operacao.
- Relationships:
  - uma categoria possui varios `Product`

## Supplier

- Purpose: registrar a origem de abastecimento e rastreabilidade comercial.
- Identity: `id`
- Fields:
  - `id`
  - `name`
  - `document`
  - `contactName`
  - `phone`
  - `email`
  - `createdAt`
  - `updatedAt`
- Invariants:
  - nome deve existir para qualquer fornecedor referenciado por produto.
- Relationships:
  - um fornecedor abastece varios `Product`

## StockLot

- Purpose: representar uma entrada rastreavel de estoque para um produto.
- Identity: `id`
- Fields:
  - `id`
  - `productId`
  - `code`
  - `receivedQuantity`
  - `remainingQuantity`
  - `entryDate`
  - `expirationDate` (nullable quando produto nao controla validade)
  - `status` (`available`, `depleted`, `expired`, `blocked`)
  - `createdAt`
  - `updatedAt`
- Invariants:
  - `receivedQuantity` deve ser maior que zero.
  - `remainingQuantity` deve ficar entre zero e `receivedQuantity`.
  - `expirationDate` e obrigatoria quando `tracksExpiration` for verdadeiro.
  - lotes vencidos nao sao elegiveis para saida comum.
- Relationships:
  - pertence a um `Product`
  - participa de varias `StockMovement`

## StockMovement

- Purpose: registrar cada alteracao de estoque de forma imutavel e auditavel.
- Identity: `id`
- Fields:
  - `id`
  - `productId`
  - `lotId` (nullable somente para produtos sem lote aplicavel ou ajustes agregados controlados)
  - `movementType` (`entry`, `exit`, `adjustment`, `expired-release`)
  - `reasonType`
    - entradas: `supplier-purchase`, `restock`, `inventory-adjustment`
    - saidas: `sale`, `loss`, `expiration`, `breakage`
  - `quantity`
  - `performedByUserId`
  - `approvedByUserId` (nullable, obrigatorio para liberacao de lote vencido)
  - `notes`
  - `occurredAt`
  - `createdAt`
- Invariants:
  - registro e imutavel depois de persistido.
  - `quantity` deve ser positiva.
  - saidas comuns respeitam saldo suficiente e FEFO.
  - liberacao de lote vencido exige aprovacao administrativa e justificativa.
- Relationships:
  - pertence a um `Product`
  - pode referenciar um `StockLot`
  - e executada por um `User`

## User

- Purpose: autenticar e autorizar operacoes de estoque e auditoria.
- Identity: `id`
- Fields:
  - `id`
  - `name`
  - `email`
  - `passwordHash`
  - `role` (`admin`, `employee`)
  - `status` (`active`, `inactive`)
  - `createdAt`
  - `updatedAt`
- Invariants:
  - senha armazenada apenas como hash bcrypt.
  - apenas `admin` pode ajustar inventario, liberar lote vencido e acessar auditoria completa.
- Relationships:
  - um usuario executa varias `StockMovement`

## Derived Read Models

### ProductStockSnapshot

- Purpose: projetar saldo atual, risco de ruptura e alertas por produto.
- Fields:
  - `productId`
  - `availableQuantity`
  - `minimumStock`
  - `isBelowMinimum`
  - `nextExpirationDate`
  - `hasExpiredLots`
  - `hasExpiringLots`

### MovementReportRow

- Purpose: suportar filtros gerenciais por periodo e tipo de movimento.
- Fields:
  - `movementId`
  - `occurredAt`
  - `productSku`
  - `productName`
  - `lotCode`
  - `movementType`
  - `reasonType`
  - `quantity`
  - `performedBy`
  - `approvedBy`

## State Transitions

- `Product.status`: `active -> inactive`; reativacao pode existir no futuro, mas
  nao muda identidade nem permite reutilizacao do SKU.
- `StockLot.status`:
  - `available -> depleted` quando `remainingQuantity` chega a zero
  - `available -> expired` quando `expirationDate` e ultrapassada
  - `expired -> blocked` quando aguardando decisao operacional
  - `expired -> available` somente por liberacao administrativa explicitamente registrada
- `User.status`: `active -> inactive`
