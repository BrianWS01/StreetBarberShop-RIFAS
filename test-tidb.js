const mariadb = require('mariadb');
require('dotenv').config();

async function testConnection() {
    console.log('\n=== TESTE DE CONEXÃO TIDB CLOUD ===\n');

    // testa diferentes configs
    const configs = [
        { name: 'Com SSL (ssl: true)', opts: { ssl: true } },
        { name: 'Com SSL object', opts: { ssl: { rejectUnauthorized: false } } },
        { name: 'Sem SSL', opts: { ssl: false } },
    ];

    for (const cfg of configs) {
        console.log(`\n--- Testando: ${cfg.name} ---`);
        let conn;
        try {
            const pool = mariadb.createPool({
                host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
                port: 4000,
                user: '4AsvMF256aSLQmy.root',
                password: 'OB2S1G5vB0F3kA1z',
                database: 'test',
                connectionLimit: 1,
                connectTimeout: 8000,
                ...cfg.opts
            });
            conn = await pool.getConnection();
            const rows = await conn.query('SHOW TABLES');
            console.log(`✅ SUCESSO! Tabelas: ${rows.map(r => Object.values(r)[0]).join(', ')}`);
            if (conn) conn.release();
            break;
        } catch (e) {
            console.error(`❌ Falhou: ${e.code || e.message}`);
            if (conn) conn.release();
        }
    }

    process.exit(0);
}

testConnection();
