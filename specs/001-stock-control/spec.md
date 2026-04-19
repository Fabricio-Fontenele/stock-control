# Feature Specification: Controle de Estoque da Conveniencia

**Feature Branch**: `001-stock-control`  
**Created**: 2026-04-19  
**Status**: Draft  
**Input**: User description: "Construa uma aplicacao de controle de estoque voltada para a conveniencia de um posto de gasolina."

## Clarifications

### Session 2026-04-19

- Q: Qual regra deve definir o lote consumido em uma saida com multiplos lotes disponiveis? → A: FEFO, consumindo primeiro o lote com vencimento mais proximo.
- Q: Quem pode registrar Ajuste de Inventario? → A: Apenas Admin pode registrar Ajuste de Inventario.
- Q: Qual janela define produtos "vencendo"? → A: Produto vence em ate 15 dias.
- Q: O SKU pode ser reutilizado apos a desativacao de um produto? → A: Nao, o SKU nunca pode ser reutilizado.
- Q: Lotes vencidos podem ser usados em saidas? → A: Apenas Admin pode liberar uso de lote vencido.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar saldo e registrar saida rapida (Priority: P1)

Como funcionario da pista, eu quero localizar rapidamente um produto e registrar
uma venda ou outra saida operacional para que o estoque reflita o consumo real
sem atrasar o atendimento.

**Why this priority**: a operacao diaria depende de consultas rapidas e baixas de
estoque confiaveis para evitar divergencia entre venda e saldo disponivel.

**Independent Test**: pode ser validada quando um funcionario encontra um produto,
visualiza saldo disponivel por lote elegivel e registra uma saida sem permitir
saldo negativo.

**Acceptance Scenarios**:

1. **Given** um funcionario autenticado com permissao de pista e um produto com
   saldo disponivel, **When** ele busca o produto por SKU ou nome e registra uma
   saida do tipo Venda, **Then** o sistema reduz o saldo automaticamente, grava a
   movimentacao com usuario, data e hora, consome primeiro o lote com vencimento
   mais proximo e mostra o saldo atualizado.
2. **Given** um funcionario autenticado e um produto sem saldo suficiente,
   **When** ele tenta registrar uma saida, **Then** o sistema bloqueia a
   operacao, informa que saldo negativo nao e permitido e mantem a rastreabilidade
   da tentativa conforme a politica de auditoria aplicavel.
3. **Given** um lote vencido associado a um produto, **When** um funcionario da
   pista tenta registrar uma venda com esse lote, **Then** o sistema bloqueia a
   saida comum e exige fluxo administrativo especifico para liberacao.

---

### User Story 2 - Receber produtos por lote e controlar validade (Priority: P2)

Como administrador do escritorio, eu quero registrar entradas por lote com datas
de entrada e vencimento para manter rastreabilidade, controlar validade e apoiar
a reposicao correta dos itens da conveniencia.

**Why this priority**: sem entradas por lote e validade, o estoque perde
confiabilidade para auditoria, reposicao e descarte de produtos pereciveis.

**Independent Test**: pode ser validada quando um administrador cadastra uma
entrada com origem, quantidade e datas do lote, e o sistema atualiza o saldo e
destaca itens vencidos ou proximos do vencimento.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado e um produto ativo, **When** ele
   registra uma entrada do tipo Compra de Fornecedor com quantidade e vencimento,
   **Then** o sistema cria o lote, aumenta o saldo disponivel e registra a
   movimentacao de auditoria com origem e responsavel.
2. **Given** um produto com multiplos lotes e pelo menos um lote proximo do
   vencimento, **When** o administrador acessa a visao de alerta, **Then** o
   sistema destaca os lotes vencidos e os que vencem em ate 15 dias.

---

### User Story 3 - Gerenciar cadastro, auditoria e reposicao (Priority: P3)

Como administrador do escritorio, eu quero manter o cadastro de produtos,
acompanhar auditoria completa e visualizar alertas gerenciais para agir antes de
faltas, perdas e vencimentos.

**Why this priority**: o valor gerencial do sistema depende de manter cadastro
confiavel, trilha de auditoria intacta e visoes de reposicao acionaveis.

**Independent Test**: pode ser validada quando um administrador cadastra ou
desativa produtos, consulta relatorios por periodo e identifica produtos abaixo
do estoque minimo, vencendo ou vencidos.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado, **When** ele cadastra ou edita um
   produto com SKU, categoria, fornecedor, precos, unidade de medida e estoque
   minimo, **Then** o sistema salva os dados obrigatorios e permite desativacao
   sem apagar historico de movimentacoes anteriores.
2. **Given** movimentacoes registradas em um periodo, **When** o administrador
   consulta a visao gerencial, **Then** o sistema apresenta relatorio filtravel
   por periodo e paineis com itens em estoque baixo, vencendo e vencidos.

### Edge Cases

- O sistema deve impedir cadastro de produto com SKU duplicado, mesmo que exista
  outro produto desativado com o mesmo identificador reservado.
- O sistema deve rejeitar entrada ou saida com quantidade igual ou menor que zero.
- O sistema deve impedir saida de produto desativado para novas operacoes comuns,
  exceto fluxos administrativos explicitamente autorizados para correcao.
- O sistema deve lidar com produtos sem controle de validade sem exigir data de
  vencimento, mantendo o mesmo produto apto a ser consultado e movimentado.
- O sistema deve destacar separadamente produtos ja vencidos e produtos proximos
  do vencimento para evitar tratamento operacional incorreto.
- O sistema nao deve permitir exclusao fisica de movimentacoes; correcoes devem
  ocorrer por novas movimentacoes de ajuste com rastreabilidade propria.
- O sistema deve selecionar automaticamente o lote a ser baixado pelo criterio de
  vencimento mais proximo entre os lotes elegiveis para saida.
- O sistema deve bloquear qualquer tentativa de Ajuste de Inventario feita por
  usuario que nao pertença ao perfil Admin (Escritorio).
- O sistema deve considerar como "vencendo" todo lote com data de vencimento em
  ate 15 dias a partir da data da consulta.
- O sistema deve bloquear o uso de lotes vencidos em saidas comuns e permitir
  liberacao apenas por fluxo administrativo explicitamente registrado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que administradores cadastrem, editem,
  consultem e desativem produtos com SKU, nome, categoria, fornecedor, preco de
  compra, preco de venda, unidade de medida e estoque minimo para alerta.
- **FR-001a**: O sistema MUST tratar o SKU como identificador unico permanente do
  produto, proibindo sua reutilizacao mesmo apos a desativacao.
- **FR-002**: O sistema MUST manter cadastro de categorias e fornecedores
  referenciaveis pelos produtos para preservar classificacao e rastreabilidade de
  origem.
- **FR-003**: O sistema MUST permitir que um produto tenha multiplos lotes de
  entrada com quantidade, data de entrada e data de vencimento quando aplicavel.
- **FR-004**: O sistema MUST registrar entradas de estoque com tipo de origem ao
  menos entre Compra de Fornecedor, Reposicao e Ajuste de Inventario.
- **FR-005**: O sistema MUST registrar saidas de estoque com tipo de operacao ao
  menos entre Venda, Perda, Vencimento e Quebra.
- **FR-006**: O sistema MUST atualizar o saldo automaticamente apos cada entrada
  ou saida confirmada.
- **FR-006a**: O sistema MUST aplicar a politica FEFO nas saidas de produtos com
  multiplos lotes elegiveis, consumindo primeiro o lote com vencimento mais
  proximo.
- **FR-007**: O sistema MUST impedir qualquer saida que resulte em saldo
  disponivel negativo para o produto ou lote controlado.
- **FR-007a**: O sistema MUST bloquear saidas comuns que tentem consumir lote
  vencido.
- **FR-007b**: O sistema MUST permitir liberacao excepcional de lote vencido
  apenas ao Admin (Escritorio), com registro explicito de usuario, data e motivo.
- **FR-008**: O sistema MUST oferecer busca rapida de produtos por SKU e nome,
  exibindo saldo atual e status de alerta.
- **FR-009**: O sistema MUST manter historico de auditoria para toda movimentacao
  com usuario responsavel, data e hora, produto, lote quando aplicavel,
  quantidade, tipo de operacao e observacao quando informada.
- **FR-010**: O sistema MUST impedir exclusao sem rastreabilidade de qualquer
  movimentacao registrada.
- **FR-011**: O sistema MUST destacar produtos e lotes vencidos e tambem aqueles
  proximos do vencimento.
- **FR-011a**: O sistema MUST classificar como "proximo do vencimento" todo lote
  que vencer em ate 15 dias a partir da data da consulta.
- **FR-012**: O sistema MUST destacar produtos abaixo do estoque minimo definido.
- **FR-013**: O sistema MUST disponibilizar relatorios gerenciais de movimentacao
  filtrados por periodo.
- **FR-014**: O sistema MUST disponibilizar paineis de alerta para estoque baixo,
  produtos vencendo e produtos vencidos.
- **FR-015**: O sistema MUST diferenciar acessos de Admin (Escritorio) e
  Funcionario (Pista), concedendo acesso total apenas ao perfil administrativo.
- **FR-016**: O sistema MUST permitir ao Funcionario (Pista) consultar saldos e
  registrar vendas ou saidas operacionais rapidas dentro das permissoes definidas.
- **FR-017**: O sistema MUST restringir ajustes de inventario, desativacao de
  produtos, auditoria completa e relatorios gerenciais ao Admin (Escritorio).
- **FR-017a**: O sistema MUST bloquear usuarios do perfil Funcionario (Pista) de
  registrar entradas ou saidas classificadas como Ajuste de Inventario.
- **FR-018**: O sistema MUST preservar historico e relatorios de produtos
  desativados sem permitir seu uso operacional normal em novas movimentacoes, salvo
  excecoes administrativas autorizadas.

### Domain Rules & Invariants *(mandatory for business workflows)*

- **DR-001**: Toda entrada de estoque deve estar vinculada a um produto ativo, a
  um tipo de origem valido, a uma quantidade positiva e a um lote identificavel
  quando o produto possuir controle por validade.
- **DR-002**: Toda saida de estoque deve estar vinculada a um produto existente,
  a um tipo de saida valido, a uma quantidade positiva e a saldo disponivel
  suficiente no momento da confirmacao.
- **DR-002a**: Quando houver mais de um lote elegivel para saida, o consumo deve
  ocorrer pelo criterio FEFO, priorizando o lote com vencimento mais proximo.
- **DR-002b**: Lote vencido nao e elegivel para saida comum; qualquer uso
  excepcional exige autorizacao administrativa rastreavel.
- **DR-003**: Produtos com controle de validade exigem lote e data de vencimento
  em cada entrada; produtos sem esse controle nao devem exigir vencimento.
- **DR-004**: Nenhuma regra de atualizacao de saldo pode existir fora do fluxo de
  movimentacao; o saldo e sempre consequencia das movimentacoes registradas.
- **DR-005**: Movimentacoes nao podem ser apagadas ou sobrescritas; qualquer
  correcao deve ocorrer por nova movimentacao de ajuste com autoria propria.
- **DR-006**: O estado de estoque baixo decorre da comparacao entre saldo atual e
  estoque minimo configurado para o produto.
- **DR-007**: O estado de vencido ou proximo do vencimento decorre da comparacao
  entre a data de consulta e a data de vencimento do lote.
- **DR-007a**: O estado "proximo do vencimento" corresponde a lotes com
  vencimento em ate 15 dias; apos esse prazo, o lote deixa de compor esse alerta.
- **DR-008**: Perfis de acesso limitam quais casos de uso cada usuario pode
  executar, mas nao alteram as invariantes de estoque e auditoria.
- **DR-009**: Ajuste de Inventario e uma operacao administrativa exclusiva do
  perfil Admin (Escritorio).
- **DR-010**: O SKU identifica de forma permanente um unico produto ao longo de
  todo o historico do sistema e nao pode ser reatribuido a outro cadastro.

### Key Entities *(include if feature involves data)*

- **Produto**: item comercializado ou controlado pela conveniencia, identificado
  por SKU, com nome, categoria, fornecedor, politica de validade, precos, unidade
  de medida, estoque minimo, status de atividade e relacao com lotes e
  movimentacoes; seu SKU permanece reservado mesmo quando o produto esta desativado.
- **Categoria**: classificacao comercial usada para organizar produtos e apoiar
  consulta, reposicao e leitura gerencial.
- **Fornecedor**: origem de abastecimento do produto, usada para rastrear compras
  e apoiar reposicao.
- **Lote de Estoque**: unidade rastreavel de entrada associada a um produto, com
  quantidade recebida, saldo remanescente, data de entrada e data de vencimento
  quando aplicavel.
- **Movimentacao de Estoque**: registro imutavel de entrada, saida ou ajuste com
  tipo, quantidade, responsavel, data e hora, observacao e referencia ao produto
  e ao lote afetado.
- **Usuario Operacional**: pessoa autenticada que atua como Admin (Escritorio) ou
  Funcionario (Pista), com permissoes compativeis com seu papel.

### Use Cases & Boundaries *(mandatory for behavioral features)*

- **UC-001**: Cadastrar, editar, consultar e desativar produto, sob responsabilidade
  da camada de aplicacao, apoiada por invariantes de Produto, Categoria e
  Fornecedor.
- **UC-002**: Registrar entrada de estoque por lote, sob responsabilidade da
  camada de aplicacao, aplicando regras de lote, origem e validade definidas no
  dominio.
- **UC-003**: Registrar saida rapida de estoque, sob responsabilidade da camada de
  aplicacao, aplicando validacao de saldo disponivel e politica de auditoria do
  dominio.
- **UC-004**: Consultar saldo e alertas por produto, sob responsabilidade da
  camada de aplicacao, consolidando informacoes de produtos, lotes e
  movimentacoes.
- **UC-005**: Consultar relatorios gerenciais e trilha de auditoria, sob
  responsabilidade da camada de aplicacao, respeitando permissoes do usuario.
- **UC-006**: Registrar ajuste de inventario, sob responsabilidade da camada de
  aplicacao, exclusivo para Admin (Escritorio) e sempre auditavel.
- **UC-007**: Autorizar uso excepcional de lote vencido, sob responsabilidade da
  camada de aplicacao, exclusivo para Admin (Escritorio) e sempre auditavel.
- **Boundary Note**: interface e persistencia apenas apresentam, recebem e armazenam
  dados; decisoes sobre saldo negativo, validade, estoque minimo, desativacao
  operacional e rastreabilidade obrigatoria pertencem ao dominio e aos casos de
  uso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Funcionarios da pista conseguem localizar um produto e registrar uma
  saida comum em ate 20 segundos em 90% das operacoes observadas.
- **SC-002**: 100% das movimentacoes confirmadas ficam disponiveis na trilha de
  auditoria com usuario, data e hora, tipo, quantidade e produto associados.
- **SC-003**: 100% das tentativas de saida que excedem o saldo disponivel sao
  bloqueadas sem alterar o saldo registrado.
- **SC-004**: Administradores conseguem identificar, em uma unica visao, todos os
  produtos abaixo do estoque minimo, vencendo e vencidos para o periodo consultado.
- **SC-004a**: 100% dos lotes com vencimento em ate 15 dias aparecem no painel de
  produtos vencendo da data consultada.
- **SC-005**: Relatorios por periodo permitem localizar e revisar movimentacoes de
  um intervalo selecionado em menos de 1 minuto para 95% das consultas gerenciais.

## Assumptions

- A aplicacao sera usada por uma unica operacao de conveniencia de posto, com
  catalogo de produtos administrado internamente.
- A janela de "validade proxima" sera fixa em 15 dias e aplicada de forma
  consistente aos paineis e consultas.
- Produtos podem ou nao exigir controle por validade, conforme sua natureza
  comercial.
- Ajustes de inventario sao operacoes administrativas excepcionais e nao substituem
  o registro normal de entradas e saidas.
- Nao existe permissao para saldo negativo em nenhum perfil operacional.
- Produtos desativados permanecem visiveis para auditoria e relatorios historicos.
