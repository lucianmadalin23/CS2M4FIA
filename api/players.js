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

    // Verificam ce coloane exista in plan_sessions
    const [cols] = await conn.execute("DESCRIBE plan_sessions");
    const colNames = cols.map(c => c.Field);

    // Alegem coloana corecta pentru playtime
    let playtimeCol = 'NULL';
    if (colNames.includes('playtime')) playtimeCol = 's.playtime';
    else if (colNames.includes('playtime_ticks')) playtimeCol = 's.playtime_ticks * 50';
    else if (colNames.includes('session_playtime_ms')) playtimeCol = 's.session_playtime_ms';
    else if (colNames.includes('length')) playtimeCol = 's.length';

    // Alegem coloana pentru mob_kills
    let mobCol = '0';
    if (colNames.includes('mob_kills')) mobCol = 's.mob_kills';

    // Alegem coloana pentru deaths
    let deathsCol = '0';
    if (colNames.includes('deaths')) deathsCol = 's.deaths';

    // Alegem coloana pentru player_kills
    let pvpCol = '0';
    if (colNames.includes('player_kills')) pvpCol = 's.player_kills';

    const query = `SELECT u.name, u.uuid, COALESCE(SUM(${playtimeCol}), 0) as playtime, COALESCE(SUM(${mobCol}), 0) as mob_kills, COALESCE(SUM(${deathsCol}), 0) as deaths, COALESCE(SUM(${pvpCol}), 0) as player_kills, MAX(s.session_end) as last_seen, ui.registered, 0 as times_kicked, '${colNames.join(',')}' as _debug_cols FROM plan_users u LEFT JOIN plan_user_info ui ON u.uuid = ui.user_id LEFT JOIN plan_sessions s ON u.uuid = s.user_id GROUP BY u.uuid, u.name, ui.registered ORDER BY playtime DESC`;

    const [players] = await conn.execute(query);
    conn.release();

    res.status(200).json({ success: true, players, _debug: { playtimeCol, colNames } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
