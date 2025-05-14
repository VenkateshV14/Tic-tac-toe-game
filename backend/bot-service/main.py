from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import random

app = FastAPI()

# ✅ Add CORS middleware correctly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MoveRequest(BaseModel):
    board: List[str]

@app.post("/bot-move")
def bot_move(data: MoveRequest):
    import random

    board = data.board
    bot_symbol = "O" if board.count("X") > board.count("O") else "X"
    player_symbol = "O" if bot_symbol == "X" else "X"
    if len(board) != 9:
        raise HTTPException(status_code=400, detail="Board must be length 9")

    WIN_COMBOS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ]

    def get_empty():
        return [i for i, cell in enumerate(board) if cell == ""]

    def winning_move(symbol):
        for combo in WIN_COMBOS:
            cells = [board[i] for i in combo]
            if cells.count(symbol) == 2 and cells.count("") == 1:
                return combo[cells.index("")]
        return None

    empty = get_empty()

    # 25% chance to miss win/block intentionally 😉
    def chance(prob):
        return random.random() < prob

    # 1. Try to win — less aggressively if bot is 'X' (first)
    if bot_symbol == "X":
        if chance(0.5):
            win = winning_move(bot_symbol)
            if win is not None:
                return {"move": win}
    else:
        win = winning_move(bot_symbol)
        if win is not None:
            return {"move": win}

    # 2. Try to block — but only 70% of the time
    if bot_symbol == "X":
        if chance(0.5):
            block = winning_move(player_symbol)
            if block is not None:
                return {"move": block}
    else:
        block = winning_move(player_symbol)
        if block is not None:
            return {"move": block}


    # 3. Smart random order of preferences (center, corners, sides)
    preferred = []

    if 4 in empty:
        preferred.append(4)

    corners = [i for i in [0, 2, 6, 8] if i in empty]
    sides = [i for i in [1, 3, 5, 7] if i in empty]

    # Mix up the order a bit to avoid repeat behavior
    random.shuffle(corners)
    random.shuffle(sides)

    preferred += corners + sides

    # Pick randomly from preferred positions
    if preferred:
        return {"move": random.choice(preferred)}

    # Fallback
    if empty:
        return {"move": random.choice(empty)}


    return {"move": -1}


