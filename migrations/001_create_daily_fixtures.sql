CREATE TABLE IF NOT EXISTS daily_fixtures (
    id VARCHAR(255) PRIMARY KEY,
    home_team VARCHAR(255) NOT NULL,
    away_team VARCHAR(255) NOT NULL,
    competition VARCHAR(255) NOT NULL,
    fixture_date TIMESTAMP WITH TIME ZONE NOT NULL,
    date_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_daily_fixtures_date ON daily_fixtures(fixture_date);
CREATE INDEX IF NOT EXISTS idx_daily_fixtures_competition ON daily_fixtures(competition); 