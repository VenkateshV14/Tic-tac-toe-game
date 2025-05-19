from fastapi import FastAPI
from pydantic import BaseModel
import asyncpg
import asyncio
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_HOST = os.getenv("DB_HOST", "postgres-service")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "tic_tac_toe")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "mysecret123")

DB_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

class GameResult(BaseModel):
    player1_name: str
    player2_name: str
    winner: str
    series_mode: int
    rounds_played: int
    score_x: int
    score_o: int

@app.on_event("startup")
async def startup_event():
    try:
        conn = await asyncpg.connect(DB_URL)
        await conn.execute("""
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
            )
        """)
        await conn.close()
        print("✅ Table ensured on startup.")
    except Exception as e:
        print("❌ Failed to create table:", e)

@app.post("/save-result")
async def save_result(data: GameResult):
    try:
        print("Saving game result:", data.dict())
        conn = await asyncpg.connect(DB_URL)
        await conn.execute("""
            INSERT INTO game_results (
                player1_name, player2_name, winner,
                series_mode, rounds_played, score_x, score_o
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        """, data.player1_name, data.player2_name, data.winner,
             data.series_mode, data.rounds_played, data.score_x, data.score_o)
        await conn.close()
        return {"status": "saved"}
    except Exception as e:
        print("Error saving result:", e)
        return {"status": "error", "detail": str(e)}

@app.get("/history")
async def get_history():
    try:
        conn = await asyncpg.connect(DB_URL)
        rows = await conn.fetch("""
            SELECT winner, series_mode FROM game_results
            WHERE winner IS NOT NULL AND winner != ''
            ORDER BY id DESC
            LIMIT 10
        """)
        await conn.close()
        return [{"winner": r["winner"], "series_mode": r["series_mode"]} for r in rows]
    except Exception as e:
        print("Error fetching history:", e)
        return {"status": "error", "detail": str(e)}

@app.delete("/clear-history")
async def clear_history():
    try:
        conn = await asyncpg.connect(DB_URL)
        await conn.execute("DELETE FROM game_results")
        await conn.close()
        return {"status": "cleared"}
    except Exception as e:
        print("Error clearing history:", e)
        return {"status": "error", "detail": str(e)}

