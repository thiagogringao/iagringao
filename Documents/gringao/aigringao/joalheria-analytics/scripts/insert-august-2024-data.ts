import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function insertAugust2024Data() {
  console.log("🔄 Conectando ao banco de dados...");
  
  const connection = await mysql.createConnection({
    host: process.env.EXTERNAL_DB_HOST!,
    port: parseInt(process.env.EXTERNAL_DB_PORT!),
    user: process.env.EXTERNAL_DB_USER!,
    password: process.env.EXTERNAL_DB_PASSWORD!,
  });

  try {
    await connection.query("USE db_gringao");
    console.log("✅ Conectado ao schema db_gringao");

    // 1. Verificar se já existem dados de agosto de 2024
    const [existing] = await connection.execute(
      "SELECT COUNT(*) as count FROM bling2_pedidos WHERE data BETWEEN '2024-08-01' AND '2024-08-31'"
    );
    
    const existingCount = (existing as any)[0].count;
    console.log(`📊 Dados existentes em agosto/2024: ${existingCount} pedidos`);

    if (existingCount > 0) {
      console.log("⚠️  Já existem dados para agosto de 2024. Deseja continuar? (Ctrl+C para cancelar)");
      // Aguarda 3 segundos
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // 2. Buscar IDs de clientes existentes
    const [clientes] = await connection.execute(
      "SELECT id FROM bling_contatos LIMIT 10"
    );
    const clienteIds = (clientes as any[]).map(c => c.id);
    
    if (clienteIds.length === 0) {
      throw new Error("Nenhum cliente encontrado no banco!");
    }

    console.log(`✅ Encontrados ${clienteIds.length} clientes para usar`);

    // 3. Buscar códigos de produtos existentes
    const [produtos] = await connection.execute(
      "SELECT codigo, preco FROM bling2_produtos WHERE preco > 0 LIMIT 20"
    );
    const produtosList = produtos as any[];
    
    if (produtosList.length === 0) {
      throw new Error("Nenhum produto encontrado no banco!");
    }

    console.log(`✅ Encontrados ${produtosList.length} produtos para usar`);

    // 4. Gerar pedidos para agosto de 2024
    const numPedidos = 25; // Número de pedidos a criar
    console.log(`\n🔄 Gerando ${numPedidos} pedidos para agosto de 2024...`);

    for (let i = 0; i < numPedidos; i++) {
      // Data aleatória em agosto de 2024
      const dia = Math.floor(Math.random() * 31) + 1;
      const dataStr = `2024-08-${String(dia).padStart(2, '0')}`;
      
      // Cliente aleatório
      const clienteId = clienteIds[Math.floor(Math.random() * clienteIds.length)];
      
      // Número de itens no pedido (1 a 5)
      const numItens = Math.floor(Math.random() * 5) + 1;
      
      // Calcular total do pedido
      let totalProdutos = 0;
      const itensPedido = [];
      
      for (let j = 0; j < numItens; j++) {
        const produto = produtosList[Math.floor(Math.random() * produtosList.length)];
        const quantidade = Math.floor(Math.random() * 3) + 1;
        const valor = parseFloat(produto.preco);
        const desconto = Math.random() < 0.3 ? (valor * 0.1) : 0; // 30% chance de desconto de 10%
        
        totalProdutos += (valor * quantidade);
        itensPedido.push({
          codigo: produto.codigo,
          quantidade,
          valor,
          desconto
        });
      }
      
      const total = totalProdutos;

      // Inserir pedido
      const [result] = await connection.execute(
        `INSERT INTO bling2_pedidos 
        (numero, numeroLoja, data, dataSaida, dataPrevista, totalProdutos, total, contato_id, contato_tipoPessoa, situacao_id, situacao_valor, loja_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          100000 + i, // numero
          `LOJA-${i}`, // numeroLoja
          dataStr, // data
          dataStr, // dataSaida
          dataStr, // dataPrevista
          totalProdutos, // totalProdutos
          total, // total
          clienteId, // contato_id
          'F', // contato_tipoPessoa
          6, // situacao_id
          15, // situacao_valor
          1 // loja_id
        ]
      );

      const pedidoId = (result as any).insertId;

      // Inserir itens do pedido
      for (const item of itensPedido) {
        await connection.execute(
          `INSERT INTO bling2_detalhes_pedidos 
          (id, data, codigo, quantidade, valor, desconto)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            pedidoId,
            dataStr,
            item.codigo,
            item.quantidade,
            item.valor,
            item.desconto
          ]
        );
      }

      console.log(`✅ Pedido ${i + 1}/${numPedidos} criado (ID: ${pedidoId}, Data: ${dataStr}, Itens: ${numItens}, Total: R$ ${total.toFixed(2)})`);
    }

    // 5. Verificar dados inseridos
    const [summary] = await connection.execute(
      `SELECT 
        COUNT(*) as total_pedidos,
        SUM(total) as faturamento_total,
        COUNT(DISTINCT contato_id) as total_clientes
      FROM bling2_pedidos 
      WHERE data BETWEEN '2024-08-01' AND '2024-08-31'`
    );

    const stats = (summary as any)[0];
    
    console.log("\n📊 RESUMO DOS DADOS INSERIDOS:");
    console.log(`   Total de Pedidos: ${stats.total_pedidos}`);
    console.log(`   Faturamento Total: R$ ${parseFloat(stats.faturamento_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`   Total de Clientes: ${stats.total_clientes}`);
    
    console.log("\n✅ Dados de agosto de 2024 inseridos com sucesso!");
    console.log("🔄 Agora você pode fazer comparações com agosto de 2025!");

  } catch (error: any) {
    console.error("❌ Erro ao inserir dados:", error.message);
    throw error;
  } finally {
    await connection.end();
    console.log("\n🔌 Conexão fechada");
  }
}

// Executar
insertAugust2024Data()
  .then(() => {
    console.log("\n✨ Script finalizado!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error);
    process.exit(1);
  });


