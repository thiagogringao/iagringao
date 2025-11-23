# 🚀 Guia de Inicialização Rápida - Joalheria Analytics

## Pré-requisitos

- Node.js 18+ instalado
- MySQL ou TiDB rodando localmente (porta 4000 para TiDB ou 3306 para MySQL)
- Acesso à internet (para APIs de LLM)

## Passo a Passo

### 1. Verificar Instalação

```bash
# Verifique se as dependências foram instaladas
npm list --depth=0
```

### 2. Configurar Banco de Dados Interno

**Opção A: Usando TiDB (Recomendado)**

```bash
# Baixe e inicie o TiDB Playground
curl --proto '=https' --tlsv1.2 -sSf https://tiup-mirrors.pingcap.com/install.sh | sh
tiup playground

# Em outro terminal, crie o banco
mysql -h 127.0.0.1 -P 4000 -u root
CREATE DATABASE joalheria_analytics;
exit;
```

**Opção B: Usando MySQL**

```bash
# Inicie o MySQL
# Crie o banco de dados
mysql -u root -p
CREATE DATABASE joalheria_analytics;
exit;

# Atualize o .env
# Substitua DATABASE_URL por:
DATABASE_URL=mysql://root:senha@127.0.0.1:3306/joalheria_analytics
```

### 3. Sincronizar Schema

```bash
npm run db:push
```

Você deverá ver:
```
✓ Schema pushed successfully
```

### 4. Iniciar a Aplicação

```bash
npm run dev
```

Isso iniciará:
- **Backend** na porta 3000: http://localhost:3000
- **Frontend** na porta 5173: http://localhost:5173

### 5. Testar a Aplicação

Abra http://localhost:5173 no navegador e:

1. Clique em "E-commerce" na sidebar
2. Digite: "Qual o faturamento de hoje?"
3. Pressione Enter
4. Aguarde a resposta (pode levar 2-3 segundos na primeira vez)

## ✅ Validação

### Teste o Backend

```bash
# Em outro terminal, teste o health check
curl http://localhost:3000/health

# Resposta esperada:
# {"status":"ok","timestamp":"2025-11-06T..."}
```

### Teste o tRPC

```bash
# Teste o endpoint tRPC
curl -X POST http://localhost:3000/trpc/health \
  -H "Content-Type: application/json" \
  -d '{"json":null}'
```

## 🐛 Problemas Comuns

### Erro: "Cannot connect to database"

**Solução:**
- Verifique se o MySQL/TiDB está rodando
- Confirme a porta correta no `.env`
- Teste a conexão: `mysql -h 127.0.0.1 -P 4000 -u root`

### Erro: "OPENROUTER_API_KEY is not defined"

**Solução:**
- Verifique se o arquivo `.env` existe
- Confirme que as chaves de API estão configuradas
- Reinicie o servidor após editar o `.env`

### Erro: "Port 3000 already in use"

**Solução:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Frontend não carrega

**Solução:**
1. Verifique se ambos os servidores estão rodando
2. Limpe o cache do navegador (Ctrl+Shift+R)
3. Verifique o console do navegador (F12)

### Erro de CORS

**Solução:**
- Certifique-se que o proxy está configurado no `vite.config.ts`
- Reinicie o servidor frontend

## 📊 Estrutura de Testes

### Teste 1: Faturamento Simples

**Pergunta:** "Qual o faturamento de hoje?"

**Resultado Esperado:**
- SQL gerado: `SELECT SUM(valor) AS faturamento FROM db_gringao.bling2_pedidos WHERE DATE(data) = CURDATE()`
- Visualização: Card com valor em R$
- Tempo de execução: < 3s

### Teste 2: Top Produtos

**Pergunta:** "Top 5 produtos mais vendidos"

**Resultado Esperado:**
- Visualização: Tabela com ranking
- Colunas: nome do produto, quantidade vendida
- Limite: 5 registros

### Teste 3: Cache

**Ação:**
1. Faça uma pergunta
2. Aguarde a resposta
3. Faça a MESMA pergunta novamente

**Resultado Esperado:**
- Segunda resposta deve ser instantânea (< 200ms)
- Badge "cached" deve aparecer

## 🎯 Próximos Passos

Depois de validar que tudo funciona:

1. Explore diferentes perguntas
2. Teste com ambos os schemas (E-commerce e Loja Física)
3. Compare Claude Sonnet vs Gemini Flash
4. Analise o histórico de conversas
5. Verifique as métricas no banco de dados

## 🔧 Scripts Úteis

```bash
# Ver estrutura do banco
npm run db:studio

# Limpar cache
mysql -h 127.0.0.1 -P 4000 -u root joalheria_analytics
DELETE FROM query_cache;

# Verificar logs do servidor
# Os logs aparecem no terminal onde rodou npm run dev

# Build de produção
npm run build
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor no terminal
2. Abra o DevTools do navegador (F12) e veja o console
3. Confirme que todas as dependências foram instaladas
4. Tente reiniciar os servidores

## ✨ Dicas

- Use **Claude Sonnet** para consultas complexas (mais preciso)
- Use **Gemini Flash** para consultas simples (mais rápido)
- Seja específico nas perguntas para melhores resultados
- Experimente diferentes visualizações mudando o tipo de pergunta

---

**Pronto para começar!** 🎉

Execute `npm run dev` e comece a fazer perguntas!

