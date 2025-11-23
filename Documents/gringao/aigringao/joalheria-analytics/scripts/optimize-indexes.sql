-- Script de Otimização de Índices para Joalheria Analytics
-- Executar no MySQL para criar índices estratégicos

-- ==========================================
-- 1. Otimizações para Loja Física (loja_fisica)
-- ==========================================

-- Índice para buscas por data (muito usado em dashboards)
CREATE INDEX IF NOT EXISTS idx_caixas_venda_data ON loja_fisica.caixas_venda(DATA);

-- Índice composto para agregações mensais/anuais (acelera GROUP BY)
CREATE INDEX IF NOT EXISTS idx_caixas_venda_data_valores ON loja_fisica.caixas_venda(DATA, VALOR_SUBT, VALOR_DESCONTO);

-- Índice para buscas por produto (acelera JOINs com produtos)
CREATE INDEX IF NOT EXISTS idx_caixas_venda_produto ON loja_fisica.caixas_venda(CODIGO_PRODUTO);

-- Índice para buscas por cliente (acelera perfil de clientes)
CREATE INDEX IF NOT EXISTS idx_caixas_venda_cliente ON loja_fisica.caixas_venda(CODIGO_CLIENTE);

-- Índice para buscas por vendedor (acelera rankings)
CREATE INDEX IF NOT EXISTS idx_caixas_venda_vendedor ON loja_fisica.caixas_venda(VENDEDOR);

-- ==========================================
-- 2. Otimizações para E-commerce (db_gringao)
-- ==========================================

-- Índice para buscas por data
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON db_gringao.bling2_pedidos(data);

-- Índice para buscas por cliente
CREATE INDEX IF NOT EXISTS idx_pedidos_contato ON db_gringao.bling2_pedidos(contato_id);

-- Índice para detalhes de pedidos (acelera buscas de itens vendidos)
CREATE INDEX IF NOT EXISTS idx_detalhes_data ON db_gringao.bling2_detalhes_pedidos(data);
CREATE INDEX IF NOT EXISTS idx_detalhes_codigo ON db_gringao.bling2_detalhes_pedidos(codigo);

-- ==========================================
-- 3. Views Materializadas (Conceito)
-- ==========================================
-- Como o MySQL 5.7 não suporta Materialized Views nativas, 
-- recomendamos o uso das tabelas de cache do sistema (SQLite)
-- que já atuam como views materializadas atualizadas incrementalmente.
