# InfraTrack Backend

This tiny backend exposes a single endpoint used by the homepage to load live statistics from PostgreSQL.

Setup

1. Create a PostgreSQL database and set the connection URL in an environment variable named `DATABASE_URL`.
   Example local connection string:

   postgres://username:password@localhost:5432/infratrack

2. Install dependencies:

```
npm install
```

3. Start the server:

```
npm start
```

Endpoint

- `GET /api/stats` — returns JSON: `{ activeReports, countriesCovered, activeUsers }`

Database schema (example)

-- reports table
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  country TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  last_active TIMESTAMP WITH TIME ZONE
);

Seed example

INSERT INTO users (name, last_active) VALUES ('Alice', NOW()), ('Bob', NOW() - INTERVAL '40 days');
INSERT INTO reports (user_id, country, status) VALUES (1, 'Kenya', 'active'), (1, 'Kenya', 'resolved'), (2, 'Ghana', 'active');

Notes

- The server reads `DATABASE_URL` from the environment. For production use provide credentials securely.
- Adjust the queries in `server.js` to match your real schema.
