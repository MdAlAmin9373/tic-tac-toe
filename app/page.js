"use client";

import { useState, useRef, useEffect } from "react";

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calculateWinner(squares) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line };
    }
  }
  return null;
}

// ---- Minimax AI (unbeatable) ----
function getEmptyIndices(squares) {
  const out = [];
  for (let i = 0; i < squares.length; i++) if (!squares[i]) out.push(i);
  return out;
}

function minimax(squares, isMaximizing) {
  const result = calculateWinner(squares);
  if (result?.winner === "O") return { score: 10 };
  if (result?.winner === "X") return { score: -10 };
  if (getEmptyIndices(squares).length === 0) return { score: 0 };

  const moves = [];
  for (const idx of getEmptyIndices(squares)) {
    const next = squares.slice();
    next[idx] = isMaximizing ? "O" : "X";
    const { score } = minimax(next, !isMaximizing);
    moves.push({ idx, score });
  }

  if (isMaximizing) {
    return moves.reduce((best, m) => (m.score > best.score ? m : best));
  }
  return moves.reduce((best, m) => (m.score < best.score ? m : best));
}

function getBestMove(squares) {
  return minimax(squares, true).idx;
}

// ---- Sound effects (Web Audio API, no external files needed) ----
function useSounds() {
  const ctxRef = useRef(null);

  function getCtx() {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctxRef.current = new AudioCtx();
    }
    return ctxRef.current;
  }

  function tone(freq, duration, type = "sine", volume = 0.15, delay = 0) {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = volume;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const startTime = ctx.currentTime + delay;
      osc.start(startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.stop(startTime + duration + 0.02);
    } catch (e) {
      // Audio not available; fail silently
    }
  }

  return {
    playClick: () => tone(440, 0.08, "square", 0.08),
    playWin: () => {
      tone(523.25, 0.15, "sine", 0.15, 0);
      tone(659.25, 0.15, "sine", 0.15, 0.15);
      tone(783.99, 0.25, "sine", 0.15, 0.3);
    },
    playDraw: () => {
      tone(300, 0.2, "triangle", 0.12, 0);
      tone(250, 0.3, "triangle", 0.12, 0.2);
    },
  };
}

function Square({ value, onClick, highlight, dark }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-24 w-24 items-center justify-center rounded-xl border-2 text-4xl font-bold transition-colors sm:h-28 sm:w-28
        ${
          highlight
            ? dark
              ? "border-emerald-400 bg-emerald-900/40"
              : "border-emerald-400 bg-emerald-50"
            : dark
            ? "border-slate-600 bg-slate-800 hover:bg-slate-700"
            : "border-slate-300 bg-white hover:bg-slate-50"
        }
        ${value === "X" ? "text-sky-500" : "text-rose-500"}`}
    >
      {value}
    </button>
  );
}

export default function Home() {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [nextStarter, setNextStarter] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [darkMode, setDarkMode] = useState(false);
  const [vsAI, setVsAI] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const sounds = useSounds();

  const result = calculateWinner(squares);
  const winner = result?.winner ?? null;
  const winLine = result?.line ?? [];
  const isDraw = !winner && squares.every((s) => s !== null);
  const gameOver = Boolean(winner) || isDraw;

  function play(soundFn) {
    if (soundOn) soundFn();
  }

  function applyMove(next) {
    setSquares(next);
    const nextResult = calculateWinner(next);
    if (nextResult) {
      setScores((s) => ({ ...s, [nextResult.winner]: s[nextResult.winner] + 1 }));
      play(sounds.playWin);
    } else if (next.every((s) => s !== null)) {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
      play(sounds.playDraw);
    } else {
      play(sounds.playClick);
    }
  }

  function handleClick(i) {
    if (squares[i] || gameOver) return;
    if (vsAI && !xIsNext) return; // block clicks during AI's turn

    const next = squares.slice();
    next[i] = xIsNext ? "X" : "O";
    applyMove(next);
    setXIsNext(!xIsNext);
  }

  // AI move effect: whenever it's O's turn in vsAI mode, let the AI play
  useEffect(() => {
    if (!vsAI || xIsNext || gameOver) return;
    const timer = setTimeout(() => {
      const idx = getBestMove(squares);
      if (idx === undefined || idx === null) return;
      const next = squares.slice();
      next[idx] = "O";
      applyMove(next);
      setXIsNext(true);
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vsAI, xIsNext, squares, gameOver]);

  function resetBoard() {
    setSquares(Array(9).fill(null));
    setXIsNext(nextStarter);
    setNextStarter(!nextStarter);
  }

  function resetAll() {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setNextStarter(false);
    setScores({ X: 0, O: 0, draws: 0 });
  }

  let status;
  if (winner) {
    status = vsAI
      ? winner === "X"
        ? "You win! 🎉"
        : "AI wins!"
      : `Winner: ${winner}`;
  } else if (isDraw) {
    status = "It's a draw!";
  } else if (vsAI) {
    status = xIsNext ? "Your turn (X)" : "AI is thinking...";
  } else {
    status = `Next turn: ${xIsNext ? "X" : "O"}`;
  }

  const bg = darkMode
    ? "bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100"
    : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800";

  return (
    <main className={`flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10 transition-colors ${bg}`}>
      <div className="flex w-full max-w-sm items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Tic Tac Toe</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSoundOn(!soundOn)}
            title="Toggle sound"
            className={`rounded-lg px-3 py-2 text-lg shadow-sm ${
              darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-white hover:bg-slate-50"
            }`}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle dark mode"
            className={`rounded-lg px-3 py-2 text-lg shadow-sm ${
              darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-white hover:bg-slate-50"
            }`}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      <label
        className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm ${
          darkMode ? "bg-slate-800" : "bg-white/70"
        }`}
      >
        <input
          type="checkbox"
          checked={vsAI}
          onChange={(e) => {
            setVsAI(e.target.checked);
            resetAll();
          }}
          className="h-4 w-4 accent-sky-500"
        />
        Play vs AI (you are X)
      </label>

      <div
        className={`flex gap-4 rounded-xl px-5 py-3 text-sm font-semibold shadow-sm sm:text-base ${
          darkMode ? "bg-slate-800" : "bg-white/70"
        }`}
      >
        <span className="text-sky-500">X: {scores.X}</span>
        <span className="text-rose-500">O: {scores.O}</span>
        <span className={darkMode ? "text-slate-400" : "text-slate-500"}>Draws: {scores.draws}</span>
      </div>

      <div
        className={`rounded-lg px-4 py-2 text-lg font-semibold shadow-sm sm:text-xl ${
          winner
            ? darkMode
              ? "bg-emerald-900/50 text-emerald-300"
              : "bg-emerald-100 text-emerald-700"
            : isDraw
            ? darkMode
              ? "bg-amber-900/50 text-amber-300"
              : "bg-amber-100 text-amber-700"
            : darkMode
            ? "bg-slate-800 text-slate-100"
            : "bg-white text-slate-700"
        }`}
      >
        {status}
      </div>

      <div className={`grid grid-cols-3 gap-3 rounded-2xl p-3 shadow-lg ${darkMode ? "bg-slate-700/60" : "bg-slate-300/60"}`}>
        {squares.map((value, i) => (
          <Square
            key={i}
            value={value}
            onClick={() => handleClick(i)}
            highlight={winLine.includes(i)}
            dark={darkMode}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={resetBoard}
          className="rounded-lg bg-sky-600 px-5 py-2 font-semibold text-white shadow transition-colors hover:bg-sky-700"
        >
          New Round
        </button>
        <button
          onClick={resetAll}
          className="rounded-lg bg-slate-500 px-5 py-2 font-semibold text-white shadow transition-colors hover:bg-slate-600"
        >
          Reset Scores
        </button>
      </div>
    </main>
  );
}
