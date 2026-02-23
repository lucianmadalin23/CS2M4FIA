const mysql = require('mysql2/promise');

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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const conn = await pool.getConnection();

    const [players] = await conn.execute(`
      SELECT u.name, u.uuid, ui.playtime, ui.mob_kills,
        ui.deaths, ui.player_kills, ui.last_seen,
        ui.registered, ui.times_kicked
      FROM plan_users u
      LEFT JOIN plan_user_info ui ON u.uuid = ui.uuid
      ORDER BY ui.playtime DESC
    `);

    const [sessions] = await conn.execute(`
      SELECT uuid, SUM(mob_kills) as total_mob_kills, SUM(deaths) as total_deaths
      FROM plan_sessions
      GROUP BY uuid
    `);

    conn.release();

    const sessionMap = {};
    sessions.forEach(s => {
      sessionMap[s.uuid] = {
        mob_kills: s.total_mob_kills || 0,
        deaths: s.total_deaths || 0
      };
    });

    const result = players.map(p => ({
      name: p.name,
      uuid: p.uuid,
      playtime: p.playtime || 0,
      mob_kills: (sessionMap[p.uuid]?.mob_kills) || p.mob_kills || 0,
      deaths: (sessionMap[p.uuid]?.deaths) || p.deaths || 0,
      player_kills: p.player_kills || 0,
      last_seen: p.last_seen || null,
      registered: p.registered || null,
      times_kicked: p.times_kicked || 0
    }));

    res.status(200).json({ success: true, players: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};
