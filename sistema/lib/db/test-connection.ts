const { Pool } = require('pg');

/**
 * Script para testar a conexão com o PostgreSQL
 * Execute com: npx ts-node lib/db/test-connection.ts
 */

async function testConnection() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
  });

  try {
    console.log('🔍 Testando conexão com PostgreSQL...');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);

    const client = await pool.connect();
    console.log('✅ Conexão bem-sucedida!');

    // Testar query simples
    const result = await client.query('SELECT NOW()');
    console.log('⏰ Hora do servidor:', result.rows[0].now);

    // Verificar tabelas
    const tablesResult = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public'"
    );
    console.log('\n📋 Tabelas existentes:');
    if (tablesResult.rows.length === 0) {
      console.log('   Nenhuma tabela encontrada. Execute schema.sql para criar.');
    } else {
      tablesResult.rows.forEach((row: any) => {
        console.log(`   - ${row.tablename}`);
      });
    }

    client.release();
    await pool.end();
    console.log('\n✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar:', error);
    process.exit(1);
  }
}

testConnection();
