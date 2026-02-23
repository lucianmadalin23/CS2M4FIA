import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'caboose.proxy.rlwy.net',
  port: 28935,
  user: 'root',
  password: 'zPiLWCXfOfZwgDLcOxZoFsWVVKyPjpak',
  database: 'railway',
  ssl: { rejectUnauthorized: false },
  connectionLimit: 5,
  waitForConnections: true,
  queueLimit: 0
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const conn = await pool.getConnection();
    const [columns] = await conn.execute("DESCRIBE plan_sessions");
    conn.release();
    res.status(200).json({ success: true, columns });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
