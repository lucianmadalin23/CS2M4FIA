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

const QUERY = `
  SELECT
    u.name,
    u.uuid,
    u.registered,
    u.times_kicked,
    COALESCE(SUM(s.session_end - s.session_start), 0) AS playtime,
    COALESCE(SUM(s.mob_kills), 0) AS mob_kills,
    COALESCE(SUM(s.deaths), 0) AS deaths,
    COALESCE(SUM(s.player_kills), 0) AS player_kills,
    MAX(s.session_end) AS last_seen
  FROM plan_users u
  LEFT JOIN plan_sessions s ON u.uuid = s.user_id
  GROUP BY u.uuid, u.name, u.registered, u.times_kicked
  ORDER BY playtime DESC
`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  try {
    const conn = await pool.getConnection();
    const [players] = await conn.execute(QUERY);
    conn.release();
    res.status(200).json({ success: true, players });
  } catch (err) {
    console.error('[API Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
