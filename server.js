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
    const infraResult = await db.query(
      'SELECT power, water, internet FROM stats ORDER BY updated_at DESC LIMIT 1'
    );

    const heroResult = await db.query(
      'SELECT active_reports, countries_covered, active_users FROM hero_stats ORDER BY updated_at DESC LIMIT 1'
    );

    if (infraResult.rows.length === 0 || heroResult.rows.length === 0) {
      return res.status(404).json({ message: 'Stats not found' });
    }

    const { power, water, internet } = infraResult.rows[0];
    const { active_reports, countries_covered, active_users } = heroResult.rows[0];

    const overall = Math.round((power + water + internet) / 3);

    const formatNumber = (value) => {
      if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
      if (value >= 1_000) return Math.floor(value / 1_000) + 'K';
      return value.toString();
    };

    res.json({
      hero: {
        activeReports: formatNumber(active_reports),
        countriesCovered: countries_covered.toString(),
        activeUsers: formatNumber(active_users),
      },
      infrastructure: {
        power: `${power}%`,
        water: `${water}%`,
        internet: `${internet}%`,
        overall: `${overall}/100`,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`🚀 InfraTrack backend listening on ${port}`)
);
