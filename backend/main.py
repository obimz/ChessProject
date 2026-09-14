"""
Grandmaster Chess Club — FastAPI Backend
Phase 1: Game Initialization Engine
"""

import chess
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os


# App Setup

app = FastAPI(
    title="Grandmaster Chess API",
    description="Backend engine for the Grandmaster Chess Club. Handles board state, move validation, and real-time sync.",
    version="1.0.0",
)

# Allow the frontend (running on a different port during dev) to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten this to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the frontend from the /frontend folder
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/static", StaticFiles(directory=os.path.join(FRONTEND_DIR, "static")), name="static")
app.mount("/assets", StaticFiles(directory=FRONTEND_DIR), name="assets")


active_games: dict[str, chess.Board] = {}



# Pydantic Schemas  

class GameInitResponse(BaseModel):
    """Returned when a new game is successfully created."""
    game_id: str
    fen: str
    turn: str          # "white" or "black"
    status: str        # "active" | "checkmate" | "stalemate" | "draw"
    message: str

class MoveRequest(BaseModel):
    """What the frontend sends when a player makes a move."""
    game_id: str
    move: str  # UCI format e.g. "e2e4"


class MoveResponse(BaseModel):
    """Returned after a move is processed."""
    game_id: str
    fen: str
    turn: str
    status: str
    message: str
    is_check: bool  # True if the resulting position puts the opponent in check

# Helper Utilities


def board_status(board: chess.Board) -> str:
    """Derive a human-readable status string from the board object."""
    if board.is_checkmate():
        return "checkmate"
    if board.is_stalemate():
        return "stalemate"
    if board.is_insufficient_material() or board.is_seventyfive_moves() or board.is_fivefold_repetition():
        return "draw"
    return "active"


def turn_label(board: chess.Board) -> str:
    return "white" if board.turn == chess.WHITE else "black"



# Routes


@app.get("/", include_in_schema=False)
async def serve_frontend():
    """Serve the main chess UI."""
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


@app.get(
    "/api/game/init",
    response_model=GameInitResponse,
    summary="Initialise a new chess game",
    tags=["Game"],
)
async def init_game():
    """
    Creates a fresh chess board, registers it in the in-memory store with a
    unique ID, and returns the starting FEN string to the client.

    The client should persist the returned `game_id` and include it in all
    subsequent move requests so the server can look up the correct board.

    Returns:
        200 OK  — GameInitResponse with game_id and FEN
    """
    board = chess.Board()          # Standard starting position
    game_id = str(uuid.uuid4())    # Unique identifier for this match
    active_games[game_id] = board  # Register in the store

    return GameInitResponse(
        game_id=game_id,
        fen=board.fen(),
        turn=turn_label(board),
        status=board_status(board),
        message="New game initialised. White to move.",
    )


@app.get(
    "/api/game/{game_id}",
    response_model=GameInitResponse,
    summary="Get current game state",
    tags=["Game"],
)
async def get_game(game_id: str):
    """
    Returns the current FEN and metadata for an existing game.
    Useful for reconnecting to a game after a page refresh.
    """
    board = active_games.get(game_id)
    if board is None:
        raise HTTPException(status_code=404, detail=f"Game '{game_id}' not found.")

    return GameInitResponse(
        game_id=game_id,
        fen=board.fen(),
        turn=turn_label(board),
        status=board_status(board),
        message=f"{'White' if board.turn == chess.WHITE else 'Black'} to move.",
    )


# Dev entry point  (run with: python main.py)

@app.post(
    "/api/game/move",
    response_model=MoveResponse,
    summary="Submit a player move",
    tags=["Game"],
)
async def make_move(request: MoveRequest):
    # 1. Look up the board
    board = active_games.get(request.game_id)
    if board is None:
        raise HTTPException(status_code=404, detail=f"Game '{request.game_id}' not found.")

    # 2. Parse the UCI string into a Move object
    try:
        move = chess.Move.from_uci(request.move)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid UCI format: '{request.move}'")

    # 3. Check if the move is legal on the current board
    if move not in board.legal_moves:
        raise HTTPException(status_code=400, detail=f"Illegal move: '{request.move}'")

    # 4. Apply the move
    board.push(move)

    # 5. Build and return the response
    return MoveResponse(
        game_id=request.game_id,
        fen=board.fen(),
        turn=turn_label(board),
        status=board_status(board),
        message=f"Move {request.move} applied.",
        is_check=board.is_check(),
    )

if __name__ == "__main__":
    import uvicorn
    print("Server starting at http://127.0.0.1:8000", flush=True)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True, log_level="info")
