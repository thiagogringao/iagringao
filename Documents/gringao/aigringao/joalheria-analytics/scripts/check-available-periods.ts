import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function checkAvailablePeriods() {
  console.log("🔄 Conectando ao banco de dados...\n");
  
  const connection = await mysql.createConnection({
    host: process.env.EXTERNAL_DB_HOST!,
    port: parseInt(process.env.EXTERNAL_DB_PORT!),
    user: process.env.EXTERNAL_DB_USER!,
    password: process.env.EXTERNAL_DB_PASSWORD!,
  });

  try {
    // Verificar db_gringao (E-commerce)
    console.log("📊 === E-COMMERCE (db_gringao) ===\n");
    await connection.query("USE db_gringao");
    
    const [periodsEcommerce] = await connection.execute(`
      SELECT 
        YEAR(data) as ano,
        MONTH(data) as mes,
        COUNT(*) as total_pedidos,
        SUM(total) as faturamento_total
      FROM bling2_pedidos
      WHERE data IS NOT NULL
      GROUP BY YEAR(data), MONTH(data)
      ORDER BY ano DESC, mes DESC
      LIMIT 12
    `);

    if ((periodsEcommerce as any[]).length === 0) {
      console.log("⚠️  Nenhum dado encontrado em db_gringao\n");
    } else {
      console.log("Períodos com dados:");
      (periodsEcommerce as any[]).forEach((period: any) => {
        const monthName = getMonthName(period.mes);
        const faturamento = parseFloat(period.faturamento_total).toLocaleString('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        });
        console.log(`  • ${monthName}/${period.ano}: ${period.total_pedidos} pedidos - ${faturamento}`);
      });
      console.log();
    }

    // Verificar loja_fisica (PDV)
    console.log("📊 === LOJA FÍSICA (loja_fisica) ===\n");
    await connection.query("USE loja_fisica");
    
    const [periodsLoja] = await connection.execute(`
      SELECT 
        YEAR(DATA) as ano,
        MONTH(DATA) as mes,
        COUNT(DISTINCT BOLETA) as total_vendas,
        SUM(VALOR_SUBT - VALOR_DESCONTO) as faturamento_total
      FROM caixas_venda
      WHERE DATA IS NOT NULL
      GROUP BY YEAR(DATA), MONTH(DATA)
      ORDER BY ano DESC, mes DESC
      LIMIT 12
    `);

    if ((periodsLoja as any[]).length === 0) {
      console.log("⚠️  Nenhum dado encontrado em loja_fisica\n");
    } else {
      console.log("Períodos com dados:");
      (periodsLoja as any[]).forEach((period: any) => {
        const monthName = getMonthName(period.mes);
        const faturamento = parseFloat(period.faturamento_total).toLocaleString('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        });
        console.log(`  • ${monthName}/${period.ano}: ${period.total_vendas} vendas - ${faturamento}`);
      });
      console.log();
    }

    console.log("✅ Análise concluída!");
    console.log("\n💡 DICA: Use esses períodos para fazer comparações na aplicação!");

  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month - 1];
}

// Executar
checkAvailablePeriods()
  .then(() => {
    console.log("\n✨ Script finalizado!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error);
    process.exit(1);
  });


