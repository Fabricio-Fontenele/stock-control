# Quickstart: Controle de Estoque da Conveniencia

## Objective

Validar o fluxo principal da API de estoque para a conveniencia cobrindo
autenticacao, cadastro basico, entrada por lote, saida rapida, alertas e
auditoria.

## Prerequisites

- Node.js 22 LTS instalado
- Docker e Docker Compose disponiveis
- variaveis de ambiente configuradas para API, JWT e PostgreSQL

## Setup

1. Suba o PostgreSQL em Docker.
2. Instale dependencias da API.
3. Execute migracoes do banco.
4. Inicie a aplicacao em modo de desenvolvimento.
5. Crie pelo menos um usuario `admin` e um usuario `employee`.

## Validation Scenario

1. Autentique como `admin` e obtenha o token JWT.
2. Cadastre uma categoria e um fornecedor.
3. Cadastre um produto ativo com SKU unico, estoque minimo e controle de validade.
4. Registre uma entrada do tipo `supplier-purchase` com lote, quantidade e data de
   vencimento futura.
5. Consulte o saldo do produto e confirme quantidade disponivel e ausencia de
   alerta de estoque baixo.
6. Autentique como `employee`.
7. Registre uma saida do tipo `sale` e confirme que:
   - o saldo foi reduzido
   - o lote consumido foi o com vencimento mais proximo
   - a movimentacao ficou auditada com usuario e horario
8. Tente registrar uma saida acima do saldo disponivel e confirme bloqueio sem
   alteracao do saldo.
9. Tente registrar um `inventory-adjustment` como `employee` e confirme bloqueio
   por permissao.
10. Como `admin`, consulte o dashboard e confirme leitura de estoque baixo,
    vencendo em ate 15 dias e vencidos.
11. Force ou simule um lote vencido e confirme que:
    - a saida comum e bloqueada
    - apenas `admin` consegue autorizar liberacao excepcional
    - a liberacao gera nova rastreabilidade
12. Consulte relatorio por periodo e a trilha de auditoria completa.

## Expected Checks

- JWT diferencia corretamente `admin` e `employee`
- senha nunca e retornada nas respostas
- SKU duplicado ou reutilizado e rejeitado
- FEFO governa consumo dos lotes elegiveis
- lotes vencidos nao participam de saida comum
- saldo nunca fica negativo
- toda movimentacao fica registrada de forma imutavel
