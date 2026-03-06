const mariadb = require('mariadb');
require('dotenv').config();

async function checkDB() {
    let conn;
    try {
        const pool = mariadb.createPool(process.env.DATABASE_URL);
        conn = await pool.getConnection();
        process.stdout.write('STATUS: CONECTADO\n');

        const tables = await conn.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
        );
        const names = tables.map(t => t.table_name || t.TABLE_NAME);
        process.stdout.write('TABELAS: ' + (names.join(', ') || 'NENHUMA') + '\n');

        if (names.length > 0) {
            const r = await conn.query("SELECT COUNT(*) as c FROM Raffle");
            process.stdout.write('RIFAS: ' + r[0].c + '\n');
            const t = await conn.query("SELECT COUNT(*) as c FROM Ticket");
            process.stdout.write('TICKETS: ' + t[0].c + '\n');
        }

        await conn.end();
        await pool.end();
    } catch (err) {
        process.stdout.write('ERRO: ' + err.message + '\n');
    }
}

checkDB();
