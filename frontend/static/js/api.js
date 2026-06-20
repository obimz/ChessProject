/**
 * api.js — FastAPI client layer
 *
 * All network communication with the backend lives here.
 * Keeping it separate from UI logic means Phase 2 (move validation)
 * only needs to add a new function — nothing else changes.
 */

"use strict";

// ── Config ────────────────────────────────────────────────────
// When the frontend is served by FastAPI itself (our setup), the API
// is on the same origin. During standalone frontend dev you can
// override this with: const API_BASE = "http://127.0.0.1:8000";
const API_BASE = "";

// ── Log helper ────────────────────────────────────────────────

/**
 * addLogEntry(message, type)
 * Appends a timestamped line to the API Activity card.
 *
 * @param {string} message
 * @param {'idle'|'request'|'success'|'error'} type
 */
function addLogEntry(message, type = "request") {
    const log = document.getElementById("apiLog");

    // Clear the initial "No requests yet" placeholder on first real entry
    if (log.querySelector(".log-idle")) {
        log.innerHTML = "";
    }

    const entry = document.createElement("p");
    entry.className = `log-entry log-${type}`;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    entry.textContent = `[${time}] ${message}`;

    log.appendChild(entry);
    log.scrollTop = log.scrollHeight; // Auto-scroll to newest
}

// ── API Calls ─────────────────────────────────────────────────

/**
 * initGame()
 * GET /api/game/init
 *
 * Asks the server to create a fresh chess board and returns the
 * GameInitResponse object (game_id, fen, turn, status, message).
 *
 * @returns {Promise<Object>} Parsed JSON response
 * @throws  {Error}           If the network request fails or server returns non-2xx
 */
async function initGame() {
    const url = `${API_BASE}/api/game/init`;
    addLogEntry(`GET ${url}`, "request");

    const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
        const errorText = await response.text();
        addLogEntry(`Error ${response.status}: ${errorText}`, "error");
        throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    addLogEntry(`200 OK — game_id: ${data.game_id.slice(0, 8)}…`, "success");
    return data;
}

/**
 * getGame(gameId)
 * GET /api/game/{game_id}
 *
 * Fetches the current state of an existing game.
 * Useful for reconnecting after a page refresh.
 *
 * @param {string} gameId
 * @returns {Promise<Object>}
 */
async function getGame(gameId) {
    const url = `${API_BASE}/api/game/${gameId}`;
    addLogEntry(`GET ${url}`, "request");

    const response = await fetch(url);

    if (!response.ok) {
        addLogEntry(`Error ${response.status} — game not found`, "error");
        throw new Error(`Game not found: ${gameId}`);
    }

    const data = await response.json();
    addLogEntry(`200 OK — turn: ${data.turn}`, "success");
    return data;
}
