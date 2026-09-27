"use client";

import { useState } from "react";

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

function Square({ value, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-24 w-24 items-center justify-center rounded-xl border-2 text-4xl font-bold transition-colors sm:h-28 sm:w-28
        ${highlight ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white hover:bg-slate-50"}
        ${value === "X" ? "text-sky-600" : "text-rose-500"}`}
    >
      {value}
    </button>
  );
}

export default function Home() {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const result = calculateWinner(squares);
  const winner = result?.winner ?? null;
  const winLine = result?.line ?? [];
  const isDraw = !winner && squares.every((s) => s !== null);

  function handleClick(i) {
    if (squares[i] || winner) return;
    const next = squares.slice();
    next[i] = xIsNext ? "X" : "O";
    setSquares(next);

    const nextResult = calculateWinner(next);
    if (nextResult) {
      setScores((s) => ({ ...s, [nextResult.winner]: s[nextResult.winner] + 1 }));
    } else if (next.every((s) => s !== null)) {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
    }

    setXIsNext(!xIsNext);
  }

  function resetBoard() {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  }

  function resetAll() {
    resetBoard();
    setScores({ X: 0, O: 0, draws: 0 });
  }

  let status;
  if (winner) {
    status = `Winner: ${winner}`;
  } else if (isDraw) {
    status = "It's a draw!";
  } else {
    status = `Next turn: ${xIsNext ? "X" : "O"}`;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
        Tic Tac Toe
      </h1>

      <div className="flex gap-4 rounded-xl bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm sm:text-base">
        <span className="text-sky-600">X: {scores.X}</span>
        <span className="text-rose-500">O: {scores.O}</span>
        <span className="text-slate-500">Draws: {scores.draws}</span>
      </div>

      <div
        className={`rounded-lg px-4 py-2 text-lg font-semibold shadow-sm sm:text-xl
        ${winner ? "bg-emerald-100 text-emerald-700" : isDraw ? "bg-amber-100 text-amber-700" : "bg-white text-slate-700"}`}
      >
        {status}
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-300/60 p-3 shadow-lg">
        {squares.map((value, i) => (
          <Square
            key={i}
            value={value}
            onClick={() => handleClick(i)}
            highlight={winLine.includes(i)}
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
