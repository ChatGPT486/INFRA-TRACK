const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/stats', async (req, res) => {
  try {
    const reportsRes = await db.query("SELECT COUNT(*) FROM reports WHERE status = 'active'");
    const countriesRes = await db.query('SELECT COUNT(DISTINCT country) FROM reports');
    const usersRes = await db.query("SELECT COUNT(*) FROM users WHERE last_active > NOW() - INTERVAL '30 days'");

    const activeReports = parseInt(reportsRes.rows[0].count, 10) || 0;
    const countriesCovered = parseInt(countriesRes.rows[0].count, 10) || 0;
    const activeUsers = parseInt(usersRes.rows[0].count, 10) || 0;

    res.json({ activeReports, countriesCovered, activeUsers });
  } catch (err) {
    console.error('Error fetching stats:', err.message || err);
    res.status(500).json({ error: 'failed_to_fetch_stats' });
  }
});

// Ingest performance metrics (supports navigator.sendBeacon and fetch)
app.post('/metrics', async (req, res) => {
  try {
    const payload = req.body || {};

    // If body was sent as a Blob by sendBeacon, express.json will parse it when Content-Type is application/json.
    const time = payload.time ? new Date(payload.time) : new Date();
    const path = payload.path || (req.body && req.body.path) || req.headers['referer'] || req.ip;
    const heartbeat = !!payload.heartbeat;
    const metrics = payload.metrics || payload;

    // Store into metrics table; keep the JSON payload for later analysis
    await db.query(
      'INSERT INTO metrics(path, received_at, heartbeat, payload) VALUES($1, $2, $3, $4)',
      [path, time, heartbeat, metrics]
    );

    // sendBeacon doesn't expect JSON response; respond with 204 No Content
    res.status(204).end();
  } catch (err) {
    console.error('Error saving metrics:', err.message || err);
    res.status(500).json({ error: 'failed_to_save_metrics' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`InfraTrack backend listening on ${port}`));
