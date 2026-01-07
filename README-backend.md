# InfraTrack Backend

This backend provides the endpoints used by the homepage and stores metrics in PostgreSQL.

Quick setup

1. Create a PostgreSQL database and set `DATABASE_URL` in the environment. Example local connection string:

   postgres://username:password@localhost:5432/infratrack

2. Install dependencies:

```
npm install
```

3. Create the database schema (run the migration):

```
psql "$DATABASE_URL" -f migrations/001_init.sql
```

4. Start the server:

```
npm start
```

API Endpoints

- `GET /api/stats` — returns JSON: `{ activeReports, countriesCovered, activeUsers }`
- `POST /metrics` — accepts performance metrics (used by the homepage via `navigator.sendBeacon` or `fetch`) and stores payload in `metrics` table.

Database schema (migration)

See `migrations/001_init.sql` — it creates the following tables:

- `users` — basic user records with `last_active` timestamp
- `reports` — recorded reports with `country` and `status`
- `metrics` — JSON payloads collected from frontends, with `received_at` and `heartbeat` flag

Seed example

```
INSERT INTO users (name, last_active) VALUES ('Alice', NOW()), ('Bob', NOW() - INTERVAL '40 days');
INSERT INTO reports (user_id, country, status) VALUES (1, 'Kenya', 'active'), (1, 'Kenya', 'resolved'), (2, 'Ghana', 'active');
```

Notes

- The server reads `DATABASE_URL` from the environment. For production, provide credentials securely.
- To inspect recent metrics: `SELECT * FROM metrics ORDER BY received_at DESC LIMIT 50;`
- Adjust the queries in `server.js` if your real schema differs.
