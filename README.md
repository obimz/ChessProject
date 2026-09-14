# Gambit Chess Demo

This project is a small chess web app prototype built with a FastAPI backend and a vanilla JavaScript frontend. It includes an in-memory chess engine, a browser-based board UI, and a simple game lifecycle for creating and querying game states.

It is a demo / portfolio-style app rather than a full production chess platform. The backend is intentionally lightweight and keeps game state in memory only.

## What is in this project?

- Backend API in `backend/main.py`
  - Creates new chess games
  - Returns the current game state
  - Validates and applies legal moves using `python-chess`
  - Serves the frontend from the same app
- Frontend in `frontend/`
  - A landing/login screen
  - A chess board dashboard
  - Demo UI animations and move scripts
- Windows setup script in `setup.bat`

## Current project structure

```text
ChessProject/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── static/
│       ├── css/
│       └── js/
├── setup.bat
├── README.md
└── .gitignore
```

## Important note

The frontend is not a fully separate React/Vite app. The `frontend` folder is a static browser app, and the FastAPI server serves it from the main app entry point. Some older docs in this repo refer to a different architecture and do not match the current code.

## Setup on Windows

### Option 1: use the setup script

From the project root:

```bat
setup.bat
```

This creates a virtual environment and installs the requirements.

### Option 2: do it manually

```bat
py -3.13 -m venv venv
venv\Scripts\activate.bat
pip install -r backend\requirements.txt
```

## Run the app

```bat
venv\Scripts\activate.bat
python backend\main.py
```

Then open:

- http://127.0.0.1:8000/
- http://127.0.0.1:8000/docs

## API overview

### GET /api/game/init
Creates a new chess game and returns the starting board state.

Example response:

```json
{
  "game_id": "3f9a1b2c-4e57-4b33-9c02-f7e5f8f4a12d",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "turn": "white",
  "status": "active",
  "message": "New game initialised. White to move."
}
```

### GET /api/game/{game_id}
Returns the current state of a stored game.

### POST /api/game/move
Submits a move in UCI format such as `e2e4`.

Request body:

```json
{
  "game_id": "3f9a1b2c-4e57-4b33-9c02-f7e5f8f4a12d",
  "move": "e2e4"
}
```

## Current limitations

- Game data is stored in memory only; it resets when the server restarts.
- There is no database or persistent login system.
- The frontend is mostly a visual demo and does not fully integrate with the backend in the same way a full game client would.
- The app is best treated as a learning / prototype project.

## Tech stack

- Python 3.13+
- FastAPI
- python-chess
- Vanilla JavaScript
- HTML + CSS

## Next possible improvements

- Add better move UI and board interaction
- Persist games to a database
- Add authentication / user sessions
- Add multiplayer or online game synchronization
- Expand the frontend to fully drive the API in a richer browser experience
