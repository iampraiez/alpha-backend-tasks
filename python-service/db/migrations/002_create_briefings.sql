CREATE TABLE IF NOT EXISTS briefings (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  ticker VARCHAR(50) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  analyst_name VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  recommendation VARCHAR(50) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  html_content TEXT
);

CREATE TABLE IF NOT EXISTS briefing_points (
  id SERIAL PRIMARY KEY,
  briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  point_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS briefing_risks (
  id SERIAL PRIMARY KEY,
  briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  risk_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS briefing_metrics (
  id SERIAL PRIMARY KEY,
  briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  value VARCHAR(100) NOT NULL,
  CONSTRAINT uix_briefing_metrics_briefing_id_name UNIQUE(briefing_id, name)
);

CREATE INDEX IF NOT EXISTS idx_briefing_points_briefing_id ON briefing_points(briefing_id);
CREATE INDEX IF NOT EXISTS idx_briefing_risks_briefing_id ON briefing_risks(briefing_id);
CREATE INDEX IF NOT EXISTS idx_briefing_metrics_briefing_id ON briefing_metrics(briefing_id);
