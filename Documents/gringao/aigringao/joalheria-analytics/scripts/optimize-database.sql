-- ============================================
-- Script de Otimização de Performance
-- Joalheria Analytics - Dashboard
-- ============================================

-- ============================================
-- 1. ÍNDICES PARA LOJA FÍSICA
-- ============================================

-- Índice composto para queries de data
CREATE INDEX IF NOT EXISTS idx_caixas_venda_data 
ON loja_fisica.caixas_venda(DATA);

-- Índice para ano (queries anuais)
CREATE INDEX IF NOT EXISTS idx_caixas_venda_ano 
ON loja_fisica.caixas_venda(YEAR(DATA));

-- Índice para mês (queries mensais)
CREATE INDEX IF NOT EXISTS idx_caixas_venda_mes 
ON loja_fisica.caixas_venda(YEAR(DATA), MONTH(DATA));

-- Índice para semana (queries semanais)
CREATE INDEX IF NOT EXISTS idx_caixas_venda_semana 
ON loja_fisica.caixas_venda(YEAR(DATA), WEEK(DATA));

-- Índice composto para valores (otimiza SUM)
CREATE INDEX IF NOT EXISTS idx_caixas_venda_valores 
ON loja_fisica.caixas_venda(DATA, VALOR_SUBT, VALOR_DESCONTO);

-- ============================================
-- 2. ÍNDICES PARA E-COMMERCE
-- ============================================

-- Índice composto para queries de data
CREATE INDEX IF NOT EXISTS idx_pedidos_data 
ON db_gringao.pedidos(data);

-- Índice para ano (queries anuais)
CREATE INDEX IF NOT EXISTS idx_pedidos_ano 
ON db_gringao.pedidos(YEAR(data));

-- Índice para mês (queries mensais)
CREATE INDEX IF NOT EXISTS idx_pedidos_mes 
ON db_gringao.pedidos(YEAR(data), MONTH(data));

-- Índice para semana (queries semanais)
CREATE INDEX IF NOT EXISTS idx_pedidos_semana 
ON db_gringao.pedidos(YEAR(data), WEEK(data));

-- Índice composto para valores (otimiza SUM)
CREATE INDEX IF NOT EXISTS idx_pedidos_valores 
ON db_gringao.pedidos(data, valor_total);

-- ============================================
-- 3. VIEWS MATERIALIZADAS (SIMULADAS)
-- ============================================

-- View para dados mensais agregados (Loja Física)
CREATE OR REPLACE VIEW loja_fisica.vw_vendas_mensais AS
SELECT 
  YEAR(DATA) as ano,
  MONTH(DATA) as mes,
  DATE_FORMAT(DATA, '%b') as mes_nome,
  COUNT(*) as total_vendas,
  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro,
  AVG(VALOR_SUBT - VALOR_DESCONTO) as ticket_medio
FROM loja_fisica.caixas_venda
GROUP BY YEAR(DATA), MONTH(DATA), DATE_FORMAT(DATA, '%b');

-- View para dados mensais agregados (E-commerce)
CREATE OR REPLACE VIEW db_gringao.vw_vendas_mensais AS
SELECT 
  YEAR(data) as ano,
  MONTH(data) as mes,
  DATE_FORMAT(data, '%b') as mes_nome,
  COUNT(*) as total_vendas,
  SUM(valor_total) as receita,
  SUM(valor_total * 0.52) as custo,
  SUM(valor_total * 0.48) as lucro,
  AVG(valor_total) as ticket_medio
FROM db_gringao.pedidos
GROUP BY YEAR(data), MONTH(data), DATE_FORMAT(data, '%b');

-- View para dados anuais agregados (Loja Física)
CREATE OR REPLACE VIEW loja_fisica.vw_vendas_anuais AS
SELECT 
  YEAR(DATA) as ano,
  COUNT(*) as total_vendas,
  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro,
  AVG(VALOR_SUBT - VALOR_DESCONTO) as ticket_medio
FROM loja_fisica.caixas_venda
GROUP BY YEAR(DATA);

-- View para dados anuais agregados (E-commerce)
CREATE OR REPLACE VIEW db_gringao.vw_vendas_anuais AS
SELECT 
  YEAR(data) as ano,
  COUNT(*) as total_vendas,
  SUM(valor_total) as receita,
  SUM(valor_total * 0.52) as custo,
  SUM(valor_total * 0.48) as lucro,
  AVG(valor_total) as ticket_medio
FROM db_gringao.pedidos
GROUP BY YEAR(data);

-- ============================================
-- 4. ANÁLISE E OTIMIZAÇÃO
-- ============================================

-- Analisar tabelas para atualizar estatísticas
ANALYZE TABLE loja_fisica.caixas_venda;
ANALYZE TABLE db_gringao.pedidos;

-- Otimizar tabelas
OPTIMIZE TABLE loja_fisica.caixas_venda;
OPTIMIZE TABLE db_gringao.pedidos;

-- ============================================
-- 5. VERIFICAR ÍNDICES CRIADOS
-- ============================================

-- Ver índices da loja física
SHOW INDEX FROM loja_fisica.caixas_venda;

-- Ver índices do e-commerce
SHOW INDEX FROM db_gringao.pedidos;

-- ============================================
-- 6. QUERIES OTIMIZADAS (EXEMPLOS)
-- ============================================

-- Query otimizada para dados mensais (usa view)
-- SELECT * FROM loja_fisica.vw_vendas_mensais 
-- WHERE ano = YEAR(CURDATE())
-- ORDER BY mes;

-- Query otimizada para dados anuais (usa view)
-- SELECT * FROM loja_fisica.vw_vendas_anuais 
-- WHERE ano >= YEAR(CURDATE()) - 2
-- ORDER BY ano;

-- ============================================
-- NOTAS:
-- ============================================
-- 1. Índices melhoram SELECT mas podem deixar INSERT/UPDATE mais lentos
-- 2. Views não são materializadas no MySQL (recalculadas a cada query)
-- 3. Para views materializadas reais, considere usar tabelas de cache
-- 4. Execute ANALYZE e OPTIMIZE periodicamente (ex: 1x por semana)
-- 5. Monitore o tamanho dos índices com: 
--    SELECT * FROM information_schema.STATISTICS WHERE table_schema = 'loja_fisica';

