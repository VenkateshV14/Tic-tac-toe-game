CREATE TABLE IF NOT EXISTS game_results (
    id SERIAL PRIMARY KEY,
    player1_name VARCHAR(50) NOT NULL,
    player2_name VARCHAR(50) NOT NULL,
    winner VARCHAR(50),
    series_mode INTEGER DEFAULT 1,
    rounds_played INTEGER DEFAULT 1,
    score_x INTEGER DEFAULT 0,
    score_o INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
