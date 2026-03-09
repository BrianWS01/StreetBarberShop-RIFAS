const mariadb = require('mariadb');
require('dotenv').config();

async function test() {
    console.log('--- TESTE DE CONEXÃO DIRETA (SSL) ---');
    const url = process.env.DATABASE_URL;
    const urlObj = new URL(url);

    const pool = mariadb.createPool({
        host: urlObj.hostname,
        port: parseInt(urlObj.port) || 4000,
        user: decodeURIComponent(urlObj.username),
        password: decodeURIComponent(urlObj.password),
        database: urlObj.pathname.replace('/', ''),
        connectionLimit: 5,
        connectTimeout: 20000,
        ssl: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        },
    });

    console.log('Tentando pegar conexão do pool...');
    try {
        const start = Date.now();
        const conn = await pool.getConnection();
        console.log(`✅ CONECTADO em ${Date.now() - start}ms!`);
        const rows = await conn.query('SELECT 1 as ok');
        console.log('Query result:', rows);
        await conn.release();
    } catch (e) {
        console.error('❌ ERRO DE CONEXÃO:', e);
    } finally {
        await pool.end();
        process.exit();
    }
}

test();
