/**
 * main.js — UI Controller (Phase 1)
 *
 * Wires together the board renderer (board.js) and the API client (api.js).
 * Handles all DOM state updates — status bar, meta panel, FEN display.
 *
 * Phase 2 will add move selection logic here.
 */

"use strict";

// ── State ─────────────────────────────────────────────────────
// A simple object to hold the session's game state.
// In Phase 3 this will be extended with WebSocket connection info.
const gameState = {
    gameId:   null,
    fen:      null,
    turn:     null,
    status:   null,
};

// ── DOM refs ──────────────────────────────────────────────────
const newGameBtn   = document.getElementById("newGameBtn");
const resetBtn     = document.getElementById("resetBtn");
const statusDot    = document.getElementById("statusDot");
const statusText   = document.getElementById("statusText");
const metaGameId   = document.getElementById("metaGameId");
const metaTurn     = document.getElementById("metaTurn");
const metaStatus   = document.getElementById("metaStatus");
const fenDisplay   = document.getElementById("fenDisplay");

// ── UI Helpers ────────────────────────────────────────────────

function setStatus(message, dotState = "") {
    statusText.textContent = message;
    statusDot.className = `status-dot ${dotState}`;
}

function updateMetaPanel(data) {
    // Truncate the UUID for display — full ID is kept in gameState
    metaGameId.textContent = data.game_id.slice(0, 13) + "…";
    metaGameId.title       = data.game_id; // Full ID on hover

    metaTurn.textContent   = data.turn.charAt(0).toUpperCase() + data.turn.slice(1);
    metaStatus.textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1);

    fenDisplay.textContent = data.fen;
}

function applyGameData(data) {
    // Save to module-level state
    gameState.gameId  = data.game_id;
    gameState.fen     = data.fen;
    gameState.turn    = data.turn;
    gameState.status  = data.status;

    // Update the board visually
    renderBoard(data.fen);

    // Update info panels
    updateMetaPanel(data);

    // Status bar
    const turnCapital = data.turn.charAt(0).toUpperCase() + data.turn.slice(1);
    setStatus(`Game active — ${turnCapital} to move.`, "active");

    // Enable reset button now that we have a game
    resetBtn.disabled = false;
}

// ── Event: New Game ───────────────────────────────────────────

newGameBtn.addEventListener("click", async () => {
    newGameBtn.disabled = true;
    setStatus("Connecting to game engine…", "loading");

    try {
        const data = await initGame();  // api.js
        applyGameData(data);
    } catch (err) {
        setStatus("Failed to connect. Is the FastAPI server running?", "error");
        console.error("[main.js] initGame error:", err);
    } finally {
        newGameBtn.disabled = false;
    }
});

// ── Event: Reset (re-init same session) ───────────────────────

resetBtn.addEventListener("click", async () => {
    if (!confirm("Start a new game? The current board will be lost.")) return;

    resetBtn.disabled = true;
    setStatus("Starting a new game…", "loading");

    try {
        const data = await initGame();
        applyGameData(data);
    } catch (err) {
        setStatus("Reset failed. Is the server still running?", "error");
    } finally {
        resetBtn.disabled = false;
    }
});

// ── Auto-reconnect on page load ───────────────────────────────
// If the user refreshed the page and we still have a game_id in
// sessionStorage, try to restore it silently.
(async () => {
    const savedId = sessionStorage.getItem("grandmaster_game_id");
    if (!savedId) return;

    setStatus("Reconnecting to previous game…", "loading");

    try {
        const data = await getGame(savedId);  // api.js
        applyGameData(data);
        sessionStorage.setItem("grandmaster_game_id", data.game_id);
    } catch {
        // Game expired or server restarted — just wait for user to press New Game
        sessionStorage.removeItem("grandmaster_game_id");
        setStatus("Press "New Game" to connect to the game engine.");
    }
})();

// Save game_id to sessionStorage whenever a game becomes active
// so the auto-reconnect above can pick it up on refresh.
const originalApply = applyGameData;
// Wrap to also persist the ID
window.addEventListener("gameActivated", (e) => {
    sessionStorage.setItem("grandmaster_game_id", e.detail.game_id);
});
