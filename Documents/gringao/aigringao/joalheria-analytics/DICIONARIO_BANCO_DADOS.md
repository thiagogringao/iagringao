# 📚 Dicionário Completo do Banco de Dados

## 📊 Visão Geral

Este documento descreve todas as tabelas, colunas e relacionamentos dos bancos de dados utilizados no sistema Joalheria Analytics.

---

## 🗄️ Estrutura dos Bancos de Dados

O sistema utiliza **3 bancos de dados principais**:

1. **db_gringao** - E-commerce (MySQL externo - READ-ONLY)
2. **loja_fisica** - Loja Física/PDV (MySQL externo - READ-ONLY)
3. **joalheria_analytics.db** - Sistema Interno (SQLite - READ/WRITE)

---

## 🛒 Schema: db_gringao (E-commerce)

**Descrição**: Banco de dados do e-commerce, alimentado pela API do Bling. Contém dados históricos de vendas online, produtos, clientes e pedidos.

**Fonte**: Bling API (backup incremental)  
**Cache TTL**: 2 horas  
**Registros**: ~175 pedidos, ~5.308 itens, ~5.945 produtos, ~11.654 clientes

### 📋 Tabelas

#### 1. `vw_revenue` (VIEW - Receitas Agregadas)

**Descrição**: View pré-calculada com receitas, custos e lucros agregados por data. Use esta view para análises de dashboard e métricas financeiras.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `data` | DATE | Data da transação |
| `receita` | DECIMAL | Valor total de receita (vendas) |
| `custo` | DECIMAL | Custo total dos produtos vendidos |
| `lucro` | DECIMAL | Lucro líquido (receita - custo) |
| `transacoes` | INT | Número de transações/pedidos |

**Chave Primária**: `data`  
**Período de Dados**: Desde 2023  
**Uso Recomendado**: Análises de receita, custo e lucro por período

---

#### 2. `bling2_pedidos`

**Descrição**: Tabela principal de pedidos do e-commerce. Cada registro representa um pedido completo.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | BIGINT | Identificador único do pedido (PK) |
| `numero` | INT | Número do pedido |
| `numeroLoja` | VARCHAR(50) | Número da loja (se aplicável) |
| `data` | DATE | Data do pedido |
| `dataSaida` | DATE | Data de saída/envio |
| `dataPrevista` | DATE | Data prevista de entrega |
| `totalProdutos` | DECIMAL(10,2) | Valor total dos produtos |
| `total` | DECIMAL(10,2) | Valor total do pedido |
| `contato_id` | BIGINT | ID do cliente (FK → bling_contatos.id) |
| `contato_tipoPessoa` | CHAR(1) | Tipo de pessoa (F/J) |
| `situacao_id` | INT | ID da situação do pedido |
| `situacao_valor` | INT | Valor da situação |
| `loja_id` | BIGINT | ID da loja |

**Chave Primária**: `id`  
**Relacionamentos**: 
- `contato_id` → `bling_contatos.id` (cliente)
- `id` → `bling2_detalhes_pedidos.id` (itens do pedido)

**Nota**: Para análises de receita/custo/lucro, prefira usar `vw_revenue`.

---

#### 3. `bling2_detalhes_pedidos`

**Descrição**: Itens individuais de cada pedido. Cada registro representa um produto vendido em um pedido.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | BIGINT | ID do pedido (FK → bling2_pedidos.id) |
| `data` | DATE | Data do item (geralmente igual à data do pedido) |
| `codigo` | VARCHAR(50) | Código do produto (FK → bling2_produtos.codigo) |
| `quantidade` | INT | Quantidade vendida |
| `valor` | DECIMAL(10,2) | Valor unitário do item |
| `desconto` | DECIMAL(10,2) | Valor do desconto aplicado |

**Chave Primária**: `id`, `codigo` (composta)  
**Registros**: ~5.308 itens  
**Relacionamentos**: 
- `id` → `bling2_pedidos.id` (pedido)
- `codigo` → `bling2_produtos.codigo` (produto)

---

#### 4. `bling2_produtos`

**Descrição**: Catálogo completo de produtos do e-commerce.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | BIGINT | Identificador único do produto (PK) |
| `idProdutoPai` | BIGINT | ID do produto pai (para variações) |
| `nome` | VARCHAR(255) | Nome do produto |
| `codigo` | VARCHAR(50) | Código único do produto (único) |
| `preco` | DECIMAL(10,2) | Preço de venda |
| `precoCusto` | DECIMAL(10,2) | Preço de custo |
| `estoque` | INT | Quantidade em estoque |
| `tipo` | VARCHAR(10) | Tipo do produto |
| `situacao` | VARCHAR(20) | Situação (ativo/inativo) |
| `formato` | VARCHAR(20) | Formato do produto |
| `imagemURL` | VARCHAR(255) | URL da imagem do produto |

**Chave Primária**: `id`  
**Registros**: ~5.945 produtos  
**Relacionamentos**: 
- `codigo` ← `bling2_detalhes_pedidos.codigo` (itens vendidos)
- `id` ← `bling_fornecedores_produtos.produto_id` (fornecedores)

**Nota**: Sempre inclua `codigo`, `nome` e `imagemURL` ao listar produtos.

---

#### 5. `bling_contatos`

**Descrição**: Cadastro de clientes do e-commerce.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | BIGINT | Identificador único do cliente (PK) |
| `nome` | VARCHAR(255) | Nome completo do cliente |
| `situacao` | VARCHAR(50) | Situação do cliente (ativo/inativo) |
| `telefone` | VARCHAR(50) | Telefone de contato |
| `celular` | VARCHAR(50) | Celular de contato |
| `numeroDocumento` | VARCHAR(50) | CPF ou CNPJ |

**Chave Primária**: `id`  
**Registros**: ~11.654 clientes  
**Relacionamentos**: 
- `id` ← `bling2_pedidos.contato_id` (pedidos do cliente)

---

#### 6. `bling_fornecedores_produtos`

**Descrição**: Relacionamento entre produtos e fornecedores (tabela de associação).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | BIGINT | Identificador único (PK) |
| `produto_id` | BIGINT | ID do produto (FK → bling2_produtos.id) |
| `fornecedor_id` | BIGINT | ID do fornecedor |

**Chave Primária**: `id`  
**Registros**: ~6.416 relacionamentos  
**Relacionamentos**: 
- `produto_id` → `bling2_produtos.id`

---

## 🏪 Schema: loja_fisica (PDV - Loja Física)

**Descrição**: Banco de dados do sistema PDV (Ponto de Venda) da loja física. Contém dados em tempo real de vendas, produtos, clientes e estoque.

**Fonte**: Sistema PDV físico  
**Cache TTL**: 30 minutos  
**Registros**: ~2.398.331 vendas, ~2.762 produtos, ~5.176 clientes

### ⚠️ IMPORTANTE: Case-Sensitive
Todas as colunas neste schema estão em **MAIÚSCULAS**. Use exatamente como mostrado.

---

### 📋 Tabelas

#### 1. `caixas_venda` (PRINCIPAL)

**Descrição**: Tabela principal de vendas. Cada registro representa um item vendido em uma transação. Esta é a tabela mais importante para análises de vendas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `SEQUENCIA` | INT | Identificador único do registro (PK) |
| `BOLETA` | VARCHAR(13) | Número da nota fiscal/venda |
| `CODIGO_PRODUTO` | VARCHAR(9) | Código do produto (pode ter menos de 13 dígitos) |
| `DESCRICAO` | VARCHAR(24) | Descrição resumida do produto |
| `QUANTIDADE` | FLOAT | Quantidade vendida |
| `VALOR_SUBT` | DECIMAL(19,4) | Valor subtotal (antes de descontos) |
| `VALOR_CUSTO_SUBT` | DECIMAL(19,4) | Custo total do item |
| `VALOR_UNITARIO` | DECIMAL(19,4) | Valor unitário do produto |
| `VALOR_DESCONTO` | DECIMAL(19,4) | Valor do desconto aplicado |
| `LOJA` | VARCHAR(3) | Código da loja |
| `CAIXA` | VARCHAR(3) | Código do caixa |
| `VENDEDOR` | VARCHAR(3) | Código do vendedor |
| `OPERADOR` | VARCHAR(3) | Código do operador |
| `DATA` | DATETIME | Data e hora da venda |
| `HORA` | VARCHAR(2) | Hora da venda |
| `CODIGO_CLIENTE` | VARCHAR(6) | Código do cliente (FK → clientes.CODIGO_CLIENTE) |

**Chave Primária**: `SEQUENCIA`  
**Registros**: ~2.398.331 vendas  
**Relacionamentos**: 
- `CODIGO_PRODUTO` → `produtos.CODIGO_INTERNO` (produto)
- `CODIGO_CLIENTE` → `clientes.CODIGO_CLIENTE` (cliente)
- `CODIGO_PRODUTO` → `vw_dprodutos.CODIGO_INTERNO` (com LPAD para imagens)

**Métricas Importantes**:
- **Faturamento**: `SUM(VALOR_SUBT - VALOR_DESCONTO)`
- **Custo**: `SUM(VALOR_CUSTO_SUBT)`
- **Quantidade**: `SUM(QUANTIDADE)`
- **Clientes únicos**: `COUNT(DISTINCT CODIGO_CLIENTE)`

**⚠️ ATENÇÃO**: 
- `CODIGO_PRODUTO` pode ter menos de 13 dígitos (ex: "023380")
- Para JOIN com `vw_dprodutos`, use: `LPAD(CODIGO_PRODUTO, 13, '0')`
- Exemplo: "023380" → "0000000023380"

---

#### 2. `produtos`

**Descrição**: Catálogo de produtos da loja física.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `CODIGO_INTERNO` | VARCHAR(9) | Código interno do produto (PK) |
| `CODIGO_BARRAS` | VARCHAR(13) | Código de barras |
| `DESCRICAO` | VARCHAR(40) | Descrição completa do produto |
| `DESCRICAO_RESUMIDA` | VARCHAR(24) | Descrição resumida |
| `CODIGO_FORNECEDOR` | VARCHAR(4) | Código do fornecedor (FK → fornecedores.CODIGO_FORNECEDOR) |
| `UNIDADE` | VARCHAR(2) | Unidade de medida (UN, KG, etc.) |

**Chave Primária**: `CODIGO_INTERNO`  
**Registros**: ~2.762 produtos  
**Relacionamentos**: 
- `CODIGO_INTERNO` ← `caixas_venda.CODIGO_PRODUTO` (vendas)
- `CODIGO_FORNECEDOR` → `fornecedores.CODIGO_FORNECEDOR` (fornecedor)

---

#### 3. `clientes`

**Descrição**: Cadastro de clientes da loja física.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `CODIGO_CLIENTE` | VARCHAR(6) | Código único do cliente (PK) |
| `NOME` | VARCHAR(40) | Nome completo do cliente |
| `RUA` | VARCHAR(40) | Endereço - rua |
| `BAIRRO` | VARCHAR(20) | Endereço - bairro |
| `CIDADE` | VARCHAR(20) | Endereço - cidade |
| `ESTADO` | VARCHAR(2) | Endereço - estado (UF) |
| `CEP` | VARCHAR(9) | CEP |
| `CONTATO` | VARCHAR(100) | Informações de contato |
| `CPF_CGC` | VARCHAR(18) | CPF ou CNPJ |
| `EMAIL` | VARCHAR(60) | E-mail do cliente |

**Chave Primária**: `CODIGO_CLIENTE`  
**Registros**: ~5.176 clientes  
**Relacionamentos**: 
- `CODIGO_CLIENTE` ← `caixas_venda.CODIGO_CLIENTE` (vendas do cliente)

---

#### 4. `estoque`

**Descrição**: Controle de estoque por localização.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `COD_LOCAL` | VARCHAR(3) | Código do local/armazém |
| `CODIGO_INTERNO` | VARCHAR(9) | Código do produto (FK → produtos.CODIGO_INTERNO) |
| `SALDO_ATUAL` | FLOAT | Quantidade atual em estoque |
| `CUSTO` | DECIMAL(19,4) | Custo unitário |
| `VALOR_VENDA` | DECIMAL(19,4) | Valor de venda |

**Chave Primária**: `CODIGO_INTERNO`, `COD_LOCAL` (composta)  
**Registros**: ~4.242 registros  
**Relacionamentos**: 
- `CODIGO_INTERNO` → `produtos.CODIGO_INTERNO` (produto)

---

#### 5. `fornecedores`

**Descrição**: Cadastro de fornecedores.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `CODIGO_FORNECEDOR` | VARCHAR(4) | Código único do fornecedor (PK) |
| `NOME` | VARCHAR(40) | Nome do fornecedor |
| `CPF_CGC` | VARCHAR(18) | CPF ou CNPJ |
| `RUA` | VARCHAR(40) | Endereço - rua |
| `CIDADE` | VARCHAR(20) | Endereço - cidade |
| `ESTADO` | VARCHAR(2) | Endereço - estado (UF) |
| `CONTATO` | VARCHAR(50) | Informações de contato |

**Chave Primária**: `CODIGO_FORNECEDOR`  
**Registros**: ~44 fornecedores  
**Relacionamentos**: 
- `CODIGO_FORNECEDOR` ← `produtos.CODIGO_FORNECEDOR` (produtos)

---

#### 6. `cancelamentos`

**Descrição**: Registro de vendas/itens cancelados no PDV.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `DATA` | DATETIME | Data do cancelamento |
| `HORA` | VARCHAR(8) | Hora do cancelamento |
| `CODIGO_AUTORIZADOR` | VARCHAR(3) | Código do autorizador |
| `OPERADOR` | VARCHAR(3) | Código do operador |
| `CAIXA` | VARCHAR(3) | Código do caixa |
| `BOLETA` | CHAR(13) | Número da nota fiscal cancelada |
| `CODIGO_INTERNO` | CHAR(6) | Código do produto cancelado |
| `QUANTIDADE` | FLOAT | Quantidade cancelada |
| `VALOR_UNITARIO` | FLOAT | Valor unitário cancelado |
| `VALOR_DESCONTO` | FLOAT | Valor do desconto cancelado |
| `CODIGO_CLIENTE` | VARCHAR(6) | Código do cliente |
| `TIPO_CANCELAMENTO` | CHAR(2) | Tipo de cancelamento |
| `VENDEDOR` | VARCHAR(3) | Código do vendedor |

**Registros**: ~176.020 cancelamentos  
**Uso**: Análise de cancelamentos, devoluções e ajustes

---

#### 7. `vw_dprodutos` (VIEW - Produtos com Imagens)

**Descrição**: View especial que contém produtos com links de imagens. Use esta view quando precisar mostrar produtos com fotos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `CODIGO_INTERNO` | VARCHAR(13) | Código do produto (SEMPRE 13 dígitos com zeros à esquerda) |
| `DESCRICAO` | VARCHAR(40) | Descrição do produto |
| `img` | VARCHAR(255) | Link da foto/imagem do produto |

**Chave Primária**: `CODIGO_INTERNO`  
**Relacionamento**: 
- `CODIGO_INTERNO` = `LPAD(caixas_venda.CODIGO_PRODUTO, 13, '0')`

**⚠️ CRÍTICO - JOIN com caixas_venda**:
```sql
INNER JOIN loja_fisica.vw_dprodutos vw 
  ON vw.CODIGO_INTERNO = LPAD(cv.CODIGO_PRODUTO, 13, '0')
```

**Exemplo**: 
- `CODIGO_PRODUTO` em `caixas_venda`: "023380" (6 dígitos)
- Após `LPAD`: "0000000023380" (13 dígitos)
- Isso permite o JOIN correto com `vw_dprodutos`

**Uso**: Sempre que o usuário pedir "foto", "imagem", "photo" ou "image" de produtos da loja física.

---

## 💾 Schema: joalheria_analytics.db (Sistema Interno)

**Descrição**: Banco de dados SQLite interno do sistema. Armazena cache, histórico de conversas, métricas e usuários.

**Tipo**: SQLite  
**Acesso**: READ/WRITE  
**Propósito**: Cache, histórico, métricas e autenticação

---

### 📋 Tabelas

#### 1. `users`

**Descrição**: Usuários do sistema de analytics.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER | Identificador único (PK, auto-incremento) |
| `openId` | TEXT | ID de autenticação (único) |
| `name` | TEXT | Nome do usuário |
| `email` | TEXT | E-mail do usuário |
| `role` | TEXT | Papel do usuário (padrão: "user") |
| `createdAt` | INTEGER | Data de criação (timestamp) |
| `updatedAt` | INTEGER | Data de atualização (timestamp) |

**Chave Primária**: `id`  
**Índices**: `openId` (único)

---

#### 2. `chat_history`

**Descrição**: Histórico completo de todas as conversas e queries executadas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER | Identificador único (PK, auto-incremento) |
| `userId` | INTEGER | ID do usuário (FK → users.id) |
| `sessionId` | TEXT | ID da sessão de conversa |
| `question` | TEXT | Pergunta feita pelo usuário |
| `sqlQuery` | TEXT | Query SQL gerada e executada |
| `response` | TEXT | Resposta em linguagem natural |
| `schema` | TEXT | Schema usado (db_gringao ou loja_fisica) |
| `executionTime` | INTEGER | Tempo de execução em milissegundos |
| `success` | INTEGER | Se a query foi bem-sucedida (boolean) |
| `errorMessage` | TEXT | Mensagem de erro (se houver) |
| `createdAt` | INTEGER | Data de criação (timestamp) |

**Chave Primária**: `id`  
**Uso**: Auditoria, histórico e análise de uso

---

#### 3. `query_cache`

**Descrição**: Cache de queries para melhorar performance. Armazena resultados de queries frequentes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER | Identificador único (PK, auto-incremento) |
| `questionHash` | TEXT | Hash SHA-256 da pergunta + schema (único) |
| `question` | TEXT | Pergunta original |
| `sqlQuery` | TEXT | Query SQL executada |
| `schema` | TEXT | Schema usado (db_gringao ou loja_fisica) |
| `result` | TEXT | Resultado da query (JSON) |
| `expiresAt` | INTEGER | Data de expiração do cache (timestamp) |
| `createdAt` | INTEGER | Data de criação (timestamp) |

**Chave Primária**: `id`  
**Índices**: `questionHash` (único)  
**TTL por Schema**:
- `db_gringao`: 2 horas (7200000 ms)
- `loja_fisica`: 30 minutos (1800000 ms)

**Uso**: Evita reexecutar queries idênticas, melhorando performance

---

#### 4. `query_metrics`

**Descrição**: Métricas de performance das queries executadas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER | Identificador único (PK, auto-incremento) |
| `schema` | TEXT | Schema usado (db_gringao ou loja_fisica) |
| `executionTime` | INTEGER | Tempo de execução em milissegundos |
| `success` | INTEGER | Se a query foi bem-sucedida (boolean) |
| `cached` | INTEGER | Se o resultado veio do cache (boolean) |
| `createdAt` | INTEGER | Data de criação (timestamp) |

**Chave Primária**: `id`  
**Uso**: Análise de performance, monitoramento e otimização

---

## 🔗 Relacionamentos Principais

### db_gringao (E-commerce)

```
bling2_pedidos
  ├─ contato_id → bling_contatos.id
  └─ id → bling2_detalhes_pedidos.id

bling2_detalhes_pedidos
  ├─ id → bling2_pedidos.id
  └─ codigo → bling2_produtos.codigo

bling2_produtos
  └─ id ← bling_fornecedores_produtos.produto_id

vw_revenue (VIEW)
  └─ Agrega dados de bling2_pedidos e bling2_detalhes_pedidos
```

### loja_fisica (PDV)

```
caixas_venda (PRINCIPAL)
  ├─ CODIGO_PRODUTO → produtos.CODIGO_INTERNO
  ├─ CODIGO_PRODUTO → vw_dprodutos.CODIGO_INTERNO (com LPAD)
  └─ CODIGO_CLIENTE → clientes.CODIGO_CLIENTE

produtos
  └─ CODIGO_FORNECEDOR → fornecedores.CODIGO_FORNECEDOR

estoque
  └─ CODIGO_INTERNO → produtos.CODIGO_INTERNO
```

### joalheria_analytics.db (Interno)

```
users
  └─ id ← chat_history.userId

chat_history
  └─ Armazena histórico de todas as queries

query_cache
  └─ Cache de queries por questionHash

query_metrics
  └─ Métricas de performance
```

---

## 📝 Convenções e Regras Importantes

### Case-Sensitivity

- **db_gringao**: Todas as colunas em **minúsculas**
  - Exemplo: `id`, `nome`, `data`, `contato_id`

- **loja_fisica**: Todas as colunas em **MAIÚSCULAS**
  - Exemplo: `SEQUENCIA`, `DATA`, `VALOR_SUBT`, `CODIGO_PRODUTO`

### Datas

- **db_gringao**: 
  - Coluna: `data` (DATE)
  - Formato: `WHERE data BETWEEN '2025-10-01' AND '2025-10-31'`
  - ⚠️ NÃO use `CURDATE()` (dados históricos)

- **loja_fisica**: 
  - Coluna: `DATA` (DATETIME)
  - Formato: `WHERE DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31'`
  - ✅ Pode usar `CURDATE()` para períodos relativos

### JOINs Especiais

#### vw_dprodutos (loja_fisica)

Sempre use `LPAD` ao fazer JOIN com `vw_dprodutos`:

```sql
INNER JOIN loja_fisica.vw_dprodutos vw 
  ON vw.CODIGO_INTERNO = LPAD(cv.CODIGO_PRODUTO, 13, '0')
```

**Por quê?**: `CODIGO_PRODUTO` em `caixas_venda` pode ter menos de 13 dígitos, mas `vw_dprodutos.CODIGO_INTERNO` sempre tem 13 dígitos (com zeros à esquerda).

### Métricas Comuns

#### Faturamento
- **db_gringao**: `SUM(receita)` (da view `vw_revenue`)
- **loja_fisica**: `SUM(VALOR_SUBT - VALOR_DESCONTO)`

#### Custo
- **db_gringao**: `SUM(custo)` (da view `vw_revenue`)
- **loja_fisica**: `SUM(VALOR_CUSTO_SUBT)`

#### Quantidade de Produtos
- **db_gringao**: `SUM(quantidade)` (de `bling2_detalhes_pedidos`)
- **loja_fisica**: `SUM(QUANTIDADE)` (de `caixas_venda`)

#### Clientes Únicos
- **db_gringao**: `COUNT(DISTINCT contato_id)` (de `bling2_pedidos`)
- **loja_fisica**: `COUNT(DISTINCT CODIGO_CLIENTE)` (de `caixas_venda`)

---

## 🎯 Quando Usar Cada Schema

### Use `db_gringao` quando:
- ✅ Análises de vendas online/e-commerce
- ✅ Dados históricos desde 2023
- ✅ Produtos do catálogo online
- ✅ Clientes do e-commerce
- ✅ Análises de receita/custo/lucro (use `vw_revenue`)

### Use `loja_fisica` quando:
- ✅ Análises de vendas presenciais
- ✅ Dados em tempo real (atualizados a cada 30 min)
- ✅ Produtos da loja física
- ✅ Clientes da loja física
- ✅ Análises de estoque por localização
- ✅ Cancelamentos e devoluções
- ✅ Produtos com imagens (use `vw_dprodutos`)

---

## 📊 Exemplos de Queries

### E-commerce - Faturamento Mensal
```sql
SELECT 
  MONTH(data) AS mes,
  SUM(receita) AS faturamento
FROM db_gringao.vw_revenue
WHERE YEAR(data) = 2025
GROUP BY MONTH(data)
ORDER BY mes
```

### Loja Física - Top 10 Produtos
```sql
SELECT 
  vw.CODIGO_INTERNO,
  vw.DESCRICAO,
  vw.img,
  SUM(cv.QUANTIDADE) AS total_vendido
FROM loja_fisica.caixas_venda cv
INNER JOIN loja_fisica.vw_dprodutos vw 
  ON vw.CODIGO_INTERNO = LPAD(cv.CODIGO_PRODUTO, 13, '0')
WHERE YEAR(cv.DATA) = 2025
GROUP BY vw.CODIGO_INTERNO, vw.DESCRICAO, vw.img
ORDER BY total_vendido DESC
LIMIT 10
```

### E-commerce - Melhor Cliente
```sql
SELECT 
  c.nome,
  COUNT(p.id) AS total_pedidos,
  SUM(p.total) AS valor_total
FROM db_gringao.bling_contatos c
INNER JOIN db_gringao.bling2_pedidos p 
  ON c.id = p.contato_id
GROUP BY c.id, c.nome
ORDER BY valor_total DESC
LIMIT 1
```

---

## 🔍 Índices e Performance

### Tabelas Principais com Índices

- `caixas_venda.DATA` - Para filtros por data
- `caixas_venda.CODIGO_PRODUTO` - Para análises de produtos
- `caixas_venda.CODIGO_CLIENTE` - Para análises de clientes
- `bling2_pedidos.data` - Para filtros por data
- `bling2_pedidos.contato_id` - Para análises de clientes
- `query_cache.questionHash` - Para lookups rápidos de cache

---

## 📅 Última Atualização

**Data**: 2025-11-08  
**Versão**: 1.0.0

---

## 📚 Referências

- [ARQUITETURA.md](./ARQUITETURA.md) - Arquitetura geral do sistema
- [COMPARACAO_SCHEMAS.md](./COMPARACAO_SCHEMAS.md) - Comparação entre schemas
- [OTIMIZACOES_PERFORMANCE.md](./OTIMIZACOES_PERFORMANCE.md) - Otimizações de performance



