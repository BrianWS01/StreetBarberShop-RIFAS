const mariadb = require('mariadb');
require('dotenv').config();

async function testMariaDB() {
  let conn;
  try {
    console.log("Tentando conectar com:", process.env.DATABASE_URL);
    // Para o driver mariadb, se usarmos createPool(string), ela deve ser mariadb://...
    const pool = mariadb.createPool(process.env.DATABASE_URL);
    conn = await pool.getConnection();
    console.log("Conectado com sucesso ao MariaDB!");

    const rows = await conn.query("SELECT COUNT(*) as total FROM Ticket");
    console.log("Total de bilhetes no banco:", rows[0].total);

  } catch (err) {
    console.error("ERRO AO CONECTAR:", err);
  } finally {
    if (conn) conn.end();
    process.exit();
  }
}

testMariaDB();
