from fastapi import FastAPI
from pydantic import BaseModel
import asyncpg
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3500", "http://54.87.71.8:3500", "http://acf51b432be3141d9b158d89466b7831-818857607.us-east-1.elb.amazonaws.com:3500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_URL = "postgresql://ttt_user:ttt_password@db:5432/tictactoe"

class GameResult(BaseModel):
    player1_name: str
    player2_name: str
    winner: str
    series_mode: int
    rounds_played: int
    score_x: int
    score_o: int

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

