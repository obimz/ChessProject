# Grandmaster Chess Club

A full-stack chess web application — FastAPI backend + vanilla JS frontend.

## Project Structure

```
grandmaster-chess/
├── backend/
│   ├── main.py              ← FastAPI application (all API routes)
│   └── requirements.txt     ← Python dependencies
├── frontend/
│   ├── index.html           ← Main page
│   └── static/
│       ├── css/style.css
│       └── js/
│           ├── board.js     ← FEN → DOM renderer
│           ├── api.js       ← Fetch calls to backend
│           └── main.js      ← UI controller / event handlers
├── setup.bat                ← One-click Windows setup
└── README.md
```

## Phase 1 Setup (Windows)

### Step 1 — Run the setup script (once only)
Double-click `setup.bat` in the project root, or run it from a terminal:

```bat
setup.bat
```

This creates a virtual environment and installs all dependencies.

### Step 2 — Start the server

```bat
venv\Scripts\activate.bat
python backend\main.py
```

### Step 3 — Open the app

| URL | What you'll see |
|-----|-----------------|
| `http://127.0.0.1:8000` | The chess UI |
| `http://127.0.0.1:8000/docs` | Interactive API docs (Swagger UI) |
| `http://127.0.0.1:8000/redoc` | Alternative API docs |

---

## API Reference

### `GET /api/game/init`
Creates a new game and returns the starting board state.

**Response:**
```json
{
  "game_id": "3f9a1b2c-...",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "turn": "white",
  "status": "active",
  "message": "New game initialised. White to move."
}
```

### `GET /api/game/{game_id}`
Returns current state of an existing game.

---

## Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Backend foundation + board render | ✅ Done |
| 2 | Move validation (`POST /api/game/move`) | 🔜 Next |
| 3 | WebSocket multiplayer sync | 🔜 Upcoming |
| 4 | Full frontend integration | 🔜 Upcoming |
