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
    const [users] = await conn.execute("SELECT COUNT(*) as total FROM plan_users");
    const [sessions] = await conn.execute("SELECT COUNT(*) as total FROM plan_sessions");
    const [sample] = await conn.execute("SELECT * FROM plan_users LIMIT 5");
    conn.release();
    res.status(200).json({ 
      success: true, 
      plan_users_count: users[0].total,
      plan_sessions_count: sessions[0].total,
      sample_users: sample
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
