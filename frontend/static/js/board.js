/**
 * board.js — FEN → DOM board renderer
 *
 * Responsible for one thing: turning a FEN string into an 8×8 grid of
 * <div class="square"> elements with the correct piece Unicode symbols.
 *
 * Phase 2 will extend this with click-to-select and drag move handling.
 */

"use strict";

// ── Unicode piece map ─────────────────────────────────────────
// FEN uses uppercase for White, lowercase for Black.
const PIECE_UNICODE = {
    // White pieces
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    // Black pieces
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

// File letters for coordinate labels
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

/**
 * parseFEN(fen)
 * Converts the board-position part of a FEN string into a flat 64-element
 * array (index 0 = a8, index 63 = h1 — top-left to bottom-right in display).
 *
 * @param {string} fen - Full FEN string
 * @returns {(string|null)[]} 64-element array; null means empty square
 */
function parseFEN(fen) {
    const positionPart = fen.split(" ")[0]; // Grab only the piece-placement field
    const ranks = positionPart.split("/");  // 8 ranks, rank 8 first

    const squares = [];

    for (const rank of ranks) {
        for (const char of rank) {
            if (Number.isInteger(parseInt(char))) {
                // A digit means N consecutive empty squares
                const empty = parseInt(char);
                for (let i = 0; i < empty; i++) squares.push(null);
            } else {
                squares.push(char); // A letter means a piece
            }
        }
    }

    return squares; // Length should always be 64
}

/**
 * renderBoard(fen)
 * Clears #chessBoard and rebuilds it from the given FEN.
 *
 * @param {string} fen
 */
function renderBoard(fen) {
    const boardEl = document.getElementById("chessBoard");
    boardEl.innerHTML = ""; // Clear placeholder or previous state

    const pieces = parseFEN(fen);

    pieces.forEach((piece, index) => {
        const row = Math.floor(index / 8); // 0 = rank 8, 7 = rank 1
        const col = index % 8;             // 0 = file a, 7 = file h

        const square = document.createElement("div");

        // Colour: light if (row + col) is even, dark if odd
        const isLight = (row + col) % 2 === 0;
        square.className = `square ${isLight ? "light" : "dark"}`;

        // Data attributes — useful for Phase 2 move handling
        square.dataset.rank = 8 - row;
        square.dataset.file = FILES[col];
        square.dataset.index = index;

        // Coordinate labels — only on border squares
        if (col === 0) {
            // Show rank number on the left edge (a-file)
            const rankLabel = document.createElement("span");
            rankLabel.className = "coord-label coord-rank";
            rankLabel.textContent = 8 - row;
            square.appendChild(rankLabel);
        }
        if (row === 7) {
            // Show file letter on the bottom edge (rank 1)
            const fileLabel = document.createElement("span");
            fileLabel.className = "coord-label coord-file";
            fileLabel.textContent = FILES[col];
            square.appendChild(fileLabel);
        }

        // Place piece if one exists on this square
        if (piece) {
            const pieceEl = document.createElement("span");
            const isWhitePiece = piece === piece.toUpperCase();
            pieceEl.className = `piece ${isWhitePiece ? "white" : "black"}`;
            pieceEl.textContent = PIECE_UNICODE[piece] ?? piece;
            pieceEl.setAttribute("aria-label", getPieceName(piece));
            square.appendChild(pieceEl);
        }

        boardEl.appendChild(square);
    });
}

/**
 * getPieceName(fenChar) — for aria-labels
 */
function getPieceName(char) {
    const names = {
        K: "White King",   Q: "White Queen",  R: "White Rook",
        B: "White Bishop", N: "White Knight",  P: "White Pawn",
        k: "Black King",   q: "Black Queen",  r: "Black Rook",
        b: "Black Bishop", n: "Black Knight",  p: "Black Pawn",
    };
    return names[char] ?? "Piece";
}
