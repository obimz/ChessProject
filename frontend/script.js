/* ════════════════════════════════════════════════════════════════════════
   GAMBIT · script.js
   Vanilla JS, no dependencies. Organised into small modules:

     1. CONSTANTS  — chess glyphs, start position, demo move scripts
     2. boardModel — a tiny board engine (place / move pieces, no rule check)
     3. renderer   — turns a board model into DOM squares + pieces
     4. ambient    — the self-playing decorative board on the landing screen
     5. game       — the dashboard board: auto-plays a game, updates the panel
     6. views      — the single-page view-management / state controller
     7. boot       — wires DOM events and starts everything

   The boards are illustrative (a portfolio showcase), so moves are applied
   verbatim from pre-defined scripts rather than validated against FIDE rules.
═══════════════════════════════════════════════════════════════════════════ */

(function () {
    "use strict";

    /* ─── 1. CONSTANTS ─────────────────────────────────────────────────── */

    // Unicode glyphs keyed by FEN-style letter (uppercase = white).
    const GLYPH = {
        K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
        k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟"
    };

    // Standard starting position, rank 8 (top) → rank 1 (bottom).
    // Each string is one rank, left (file a) → right (file h). "." = empty.
    const START_POSITION = [
        "rnbqkbnr",
        "pppppppp",
        "........",
        "........",
        "........",
        "........",
        "PPPPPPPP",
        "RNBQKBNR"
    ];

    // Ambient loop: a sequence of long-algebraic moves (from→to) that play
    // forever on the landing screen purely for atmosphere.
    const AMBIENT_SCRIPT = [
        "e2e4", "e7e5", "g1f3", "b8c6", "f1c4",
        "f8c5", "b2b4", "c5b4", "c2c3", "b4a5"
    ];

    // Dashboard demo: the opening of a real game (Italian / Evans Gambit feel)
    // with metadata so the move log + stats can be populated convincingly.
    const GAME_SCRIPT = [
        { uci: "e2e4", san: "e4",   capture: false, eval: "+0.2" },
        { uci: "e7e5", san: "e5",   capture: false, eval: "+0.1" },
        { uci: "g1f3", san: "Nf3",  capture: false, eval: "+0.3" },
        { uci: "b8c6", san: "Nc6",  capture: false, eval: "+0.2" },
        { uci: "f1c4", san: "Bc4",  capture: false, eval: "+0.4" },
        { uci: "f8c5", san: "Bc5",  capture: false, eval: "+0.2" },
        { uci: "c2c3", san: "c3",   capture: false, eval: "+0.5" },
        { uci: "g8f6", san: "Nf6",  capture: false, eval: "+0.3" },
        { uci: "d2d4", san: "d4",   capture: false, eval: "+0.6" },
        { uci: "e5d4", san: "exd4", capture: true,  eval: "+0.4" },
        { uci: "c3d4", san: "cxd4", capture: true,  eval: "+0.7" },
        { uci: "c5b4", san: "Bb4+", capture: false, eval: "+0.5" }
    ];

    const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];


    /* ─── 2. boardModel ────────────────────────────────────────────────── */
    // A board is an 8×8 array of single-char codes ("." for empty).
    // Indexing: grid[rank][file] where rank 0 = rank 8 (top of the board).
    const boardModel = {
        // Build a fresh grid from a position template (deep copy).
        create(position) {
            return position.map(row => row.split(""));
        },

        // Convert algebraic square ("e4") to [rankIndex, fileIndex].
        squareToIndex(square) {
            const file = FILES.indexOf(square[0]);
            const rank = 8 - Number(square[1]);   // "8" → row 0, "1" → row 7
            return [rank, file];
        },

        // Apply a "from→to" UCI move in place. Returns the captured code
        // (or "." if the destination was empty) so callers can tally captures.
        applyMove(grid, uci) {
            const [fr, ff] = this.squareToIndex(uci.slice(0, 2));
            const [tr, tf] = this.squareToIndex(uci.slice(2, 4));
            const moving = grid[fr][ff];
            const captured = grid[tr][tf];
            grid[tr][tf] = moving;
            grid[fr][ff] = ".";
            return captured;
        }
    };


    /* ─── 3. renderer ──────────────────────────────────────────────────── */
    // Renders a board model into a container of 64 .square elements and keeps
    // a lookup of square→element so pieces can be re-rendered cheaply.
    function createRenderer(container) {
        const cells = [];   // flat array of 64 square elements, row-major

        // Build the 64 squares once. Colour alternates with (rank+file) parity.
        function build() {
            container.innerHTML = "";
            for (let r = 0; r < 8; r++) {
                for (let f = 0; f < 8; f++) {
                    const cell = document.createElement("div");
                    const isLight = (r + f) % 2 === 0;
                    cell.className = "square " + (isLight ? "square--light" : "square--dark");
                    cell.dataset.square = FILES[f] + (8 - r);
                    container.appendChild(cell);
                    cells.push(cell);
                }
            }
        }

        // Paint every square's piece from the model.
        function paint(grid) {
            for (let r = 0; r < 8; r++) {
                for (let f = 0; f < 8; f++) {
                    const code = grid[r][f];
                    const cell = cells[r * 8 + f];
                    if (code === ".") {
                        cell.textContent = "";
                        continue;
                    }
                    cell.innerHTML =
                        `<span class="piece ${code === code.toUpperCase()
                            ? "piece--white" : "piece--black"}">${GLYPH[code]}</span>`;
                }
            }
        }

        // Briefly highlight the destination square of the latest move.
        function flash(square) {
            const cell = container.querySelector(`[data-square="${square}"]`);
            if (!cell) return;
            cell.classList.add("square--active");
            setTimeout(() => cell.classList.remove("square--active"), 650);
        }

        build();
        return { paint, flash };
    }


    /* ─── 4. ambient ───────────────────────────────────────────────────── */
    // The decorative, non-interactive board on the landing screen. It loops
    // through AMBIENT_SCRIPT on a timer, resetting once the script is spent.
    const ambient = (function () {
        let grid, renderer, caption, timer, step = 0;

        function tick() {
            // Reset to the opening position once the script has played out.
            if (step >= AMBIENT_SCRIPT.length) {
                step = 0;
                grid = boardModel.create(START_POSITION);
                renderer.paint(grid);
                return;
            }
            const move = AMBIENT_SCRIPT[step++];
            boardModel.applyMove(grid, move);
            renderer.paint(grid);
            renderer.flash(move.slice(2, 4));
            // Show the move in the caption, e.g. "e2 → e4".
            caption.textContent = `${move.slice(0, 2)} → ${move.slice(2, 4)}`;
        }

        return {
            start() {
                if (timer) return;                       // already running
                const board = document.getElementById("ambientBoard");
                caption = document.getElementById("ambientCaption");
                renderer = createRenderer(board);
                grid = boardModel.create(START_POSITION);
                renderer.paint(grid);
                timer = setInterval(tick, 1700);
            },
            stop() { clearInterval(timer); timer = null; }
        };
    })();


    /* ─── 5. game (dashboard) ──────────────────────────────────────────── */
    // The center board on the dashboard. Auto-plays GAME_SCRIPT and keeps the
    // right-hand panel (turn indicator, move log, stats) in sync.
    const game = (function () {
        let grid, renderer, timer, step = 0, captures = 0;

        // Cache panel elements once.
        const el = {};
        function cache() {
            el.moveLog   = document.getElementById("moveLog");
            el.turnText  = document.querySelector("#turnIndicator .turn-text");
            el.statMoves = document.getElementById("statMoves");
            el.statCaps  = document.getElementById("statCaptures");
            el.statEval  = document.getElementById("statEval");
        }

        // Add a ply to the move log, grouping White + Black under one number.
        function logMove(index, san) {
            const isWhite = index % 2 === 0;
            const moveNo = Math.floor(index / 2) + 1;

            // Drop the "latest" highlight from the previous ply.
            const prev = el.moveLog.querySelector(".move-log__ply--latest");
            if (prev) prev.classList.remove("move-log__ply--latest");

            if (isWhite) {
                // Start a new numbered row.
                const row = document.createElement("li");
                row.className = "move-log__row";
                row.innerHTML =
                    `<span class="move-log__num">${moveNo}.</span>` +
                    `<span class="move-log__ply move-log__ply--latest">${san}</span>` +
                    `<span class="move-log__ply"></span>`;
                el.moveLog.appendChild(row);
            } else {
                // Fill the Black cell of the current (last) row.
                const row = el.moveLog.lastElementChild;
                const black = row.querySelectorAll(".move-log__ply")[1];
                black.textContent = san;
                black.classList.add("move-log__ply--latest");
            }
            el.moveLog.scrollTop = el.moveLog.scrollHeight;
        }

        function tick() {
            if (step >= GAME_SCRIPT.length) { clearInterval(timer); timer = null; return; }

            const move = GAME_SCRIPT[step];
            const captured = boardModel.applyMove(grid, move.uci);
            renderer.paint(grid);
            renderer.flash(move.uci.slice(2, 4));
            logMove(step, move.san);

            if (captured !== ".") captures++;
            step++;

            // Update panel: next side to move, running tallies, latest eval.
            const whiteToMove = step % 2 === 0;
            el.turnText.textContent = whiteToMove ? "White to move" : "Black to move";
            el.statMoves.textContent = Math.ceil(step / 2);
            el.statCaps.textContent = captures;
            el.statEval.textContent = move.eval;
        }

        return {
            // (Re)start the demo game from move one.
            start() {
                const board = document.getElementById("gameBoard");
                renderer = createRenderer(board);
                cache();
                grid = boardModel.create(START_POSITION);
                renderer.paint(grid);

                // Reset panel state.
                step = 0; captures = 0;
                el.moveLog.innerHTML = "";
                el.turnText.textContent = "White to move";
                el.statMoves.textContent = "0";
                el.statCaps.textContent = "0";
                el.statEval.textContent = "+0.0";

                clearInterval(timer);
                timer = setInterval(tick, 1500);
            },
            stop() { clearInterval(timer); timer = null; }
        };
    })();


    /* ─── 6. views (state controller) ──────────────────────────────────── */
    // Owns which screen is visible. Toggling the `.hidden` utility class is
    // the entire view-management mechanism — no routing, no reloads.
    const views = {
        current: "landing",

        screens: {
            landing: () => document.getElementById("screen-landing"),
            dashboard: () => document.getElementById("screen-dashboard")
        },

        show(name) {
            // Hide every screen, then reveal the requested one.
            Object.values(this.screens).forEach(get => get().classList.add("hidden"));
            this.screens[name]().classList.remove("hidden");
            this.current = name;

            // Start/stop the per-screen animations so timers never run unseen.
            if (name === "dashboard") { ambient.stop(); game.start(); }
            else                      { game.stop(); ambient.start(); }
        }
    };

    // Switch the active panel/view inside the dashboard (Play/Analytics/History).
    // For this portfolio scaffold the views share the gameplay stage; selecting
    // a nav item just moves the gold highlight and updates the turn label.
    function setDashboardView(view, clicked) {
        document.querySelectorAll(".nav-item[data-view]")
            .forEach(btn => btn.classList.toggle("is-active", btn === clicked));

        const label = { play: "White to move", analytics: "Analysis mode", history: "Reviewing game" };
        const turnText = document.querySelector("#turnIndicator .turn-text");
        if (turnText && label[view]) turnText.textContent = label[view];
    }


    /* ─── 7. boot ──────────────────────────────────────────────────────── */
    function boot() {
        // Kick off the ambient board on the landing screen immediately.
        ambient.start();

        // Login → enter the dashboard. We never actually authenticate here;
        // the form is intercepted and the username is echoed into the dash.
        const loginForm = document.getElementById("loginForm");
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value.trim() || "Player";
            document.getElementById("dashUsername").textContent = username;
            views.show("dashboard");
        });

        // Sidebar navigation.
        document.querySelectorAll(".nav-item[data-view]").forEach(btn => {
            btn.addEventListener("click", () => setDashboardView(btn.dataset.view, btn));
        });

        // Sign out → back to the landing screen.
        document.getElementById("logoutBtn").addEventListener("click", () => {
            views.show("landing");
        });
    }

    // Run once the DOM is parsed.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
