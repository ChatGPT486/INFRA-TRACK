-- Migration: create_metrics_table.sql
-- Run this with psql or your migration tool:
-- psql "${DATABASE_URL}" -f migrations/create_metrics_table.sql

CREATE TABLE IF NOT EXISTS metrics (
  id BIGSERIAL PRIMARY KEY,
  path TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  heartbeat BOOLEAN DEFAULT FALSE,
  payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_metrics_received_at ON metrics(received_at);
CREATE INDEX IF NOT EXISTS idx_metrics_heartbeat ON metrics(heartbeat);
