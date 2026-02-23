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

const QUERY = "SELECT u.name, u.uuid, COALESCE(SUM(s.session_end - s.session_start), 0) as playtime, COALESCE(SUM(s.mob_kills), 0) as mob_kills, COALESCE(SUM(s.deaths), 0) as deaths, 0 as player_kills, MAX(s.session_end) as last_seen, ui.registered, 0 as times_kicked FROM plan_users u LEFT JOIN plan_user_info ui ON u.uuid = ui.user_id LEFT JOIN plan_sessions s ON u.uuid = s.user_id GROUP BY u.uuid, u.name, ui.registered ORDER BY playtime DESC";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const conn = await pool.getConnection();
    const [players] = await conn.execute(QUERY);
    conn.release();
    res.status(200).json({ success: true, players });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
