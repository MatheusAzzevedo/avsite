const { Pool } = require('pg');

async function testConnection() {
  const pool = new Pool({
    user: 'postgres',
    password: 'MQiRmZJvxxAbbgOBrIvvYtHfkeuTNpjH',
    host: 'yamanote.proxy.rlwy.net',
    port: 13538,
    database: 'railway',
  });

  try {
    console.log('🔍 Testando conexão com PostgreSQL...');
    console.log('   Host: yamanote.proxy.rlwy.net:13538');
    console.log('   Database: railway');
    console.log('   User: postgres');

    const client = await pool.connect();
    console.log('✅ Conexão bem-sucedida!\n');

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
      tablesResult.rows.forEach((row) => {
        console.log(`   ✓ ${row.tablename}`);
      });
    }

    // Contar registros
    console.log('\n📊 Registros por tabela:');
    const tables = ['users', 'blog_posts', 'excursoes', 'payment_config'];
    for (const table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   - ${table}: ${countResult.rows[0].count} registros`);
    }

    client.release();
    await pool.end();
    console.log('\n✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    process.exit(1);
  }
}

testConnection();
