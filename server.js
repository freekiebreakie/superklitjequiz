const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const QUESTION_TIME = 20;
const MAX_POINTS = 1000;
const MIN_POINTS = 100;

const questions = JSON.parse(fs.readFileSync(path.join(__dirname, "questions.json"), "utf8"));

// Single global game
let game = null;

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function broadcast(obj, excludeWs = null) {
  for (const player of game.players.values()) {
    if (player.ws !== excludeWs) send(player.ws, obj);
  }
}

function buildLeaderboard() {
  return [...game.players.values()]
    .map((p) => ({ nickname: p.nickname, score: p.score, streak: p.streak }))
    .sort((a, b) => b.score - a.score);
}

function startQuestionTimer() {
  const q = questions[game.questionIndex];
  game.timerStart = Date.now();
  game.answeredCount = 0;
  game.answerMap = new Map();

  let timeLeft = QUESTION_TIME;

  send(game.hostWs, {
    type: "questionStart",
    questionIndex: game.questionIndex,
    total: questions.length,
    question: q.question,
    answers: q.answers,
    photo: q.photo || null,
    timeLimit: QUESTION_TIME,
  });
  broadcast({
    type: "questionStart",
    questionIndex: game.questionIndex,
    total: questions.length,
    question: q.question,
    answers: q.answers,
    photo: q.photo || null,
    timeLimit: QUESTION_TIME,
  });

  game.timer = setInterval(() => {
    timeLeft -= 1;
    const tick = { type: "tick", timeLeft };
    send(game.hostWs, tick);
    broadcast(tick);
    if (timeLeft <= 0) {
      clearInterval(game.timer);
      revealAnswer();
    }
  }, 1000);
}

function revealAnswer() {
  const q = questions[game.questionIndex];
  for (const player of game.players.values()) {
    if (!game.answerMap.has(player.nickname)) player.streak = 0;
  }
  const voteCounts = new Array(q.answers.length).fill(0);
  for (const entry of game.answerMap.values()) {
    if (entry.index >= 0 && entry.index < voteCounts.length) {
      voteCounts[entry.index]++;
    }
  }
  const payload = {
    type: "answerReveal",
    correctIndex: q.correct,
    leaderboard: buildLeaderboard(),
    isLast: game.questionIndex >= questions.length - 1,
    voteCounts,
    photo: q.photo || null,
  };
  send(game.hostWs, payload);
  broadcast(payload);
  game.state = "reveal";
}

// ── WebSocket ──────────────────────────────────────────────────────────────

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case "createGame": {
        if (game) { clearInterval(game.timer); }
        game = {
          hostWs: ws,
          players: new Map(),
          state: "lobby",
          questionIndex: 0,
          timer: null,
          timerStart: null,
          answerMap: new Map(),
          answeredCount: 0,
        };
        ws.role = "host";
        send(ws, { type: "gameCreated", totalQuestions: questions.length });
        console.log("Game created");
        break;
      }

      case "joinGame": {
        if (!game) { send(ws, { type: "error", message: "Nog geen spel gestart!" }); return; }
        if (game.state !== "lobby") { send(ws, { type: "error", message: "Spel is al begonnen!" }); return; }
        const name = (msg.nickname || "").trim().slice(0, 20);
        if (!name) { send(ws, { type: "error", message: "Geef een naam op!" }); return; }
        if (game.players.has(name)) { send(ws, { type: "error", message: "Naam al in gebruik!" }); return; }

        game.players.set(name, { ws, nickname: name, score: 0, streak: 0 });
        ws.nickname = name;
        ws.role = "player";

        send(ws, { type: "joinedGame", nickname: name });
        send(game.hostWs, { type: "playerJoined", nickname: name, playerCount: game.players.size });
        console.log(`${name} joined (${game.players.size} players)`);
        break;
      }

      case "startGame": {
        if (!game || ws.role !== "host" || game.state !== "lobby") return;
        if (game.players.size === 0) { send(ws, { type: "error", message: "Geen spelers!" }); return; }
        game.state = "question";
        game.questionIndex = 0;
        broadcast({ type: "gameStarting" });
        setTimeout(startQuestionTimer, 1500);
        console.log(`Game started with ${game.players.size} players`);
        break;
      }

      case "nextQuestion": {
        if (!game || ws.role !== "host" || game.state !== "reveal") return;
        game.questionIndex += 1;
        if (game.questionIndex >= questions.length) {
          game.state = "end";
          const leaderboard = buildLeaderboard();
          send(game.hostWs, { type: "gameEnd", leaderboard });
          broadcast({ type: "gameEnd", leaderboard });
        } else {
          game.state = "question";
          broadcast({ type: "getReady" });
          setTimeout(startQuestionTimer, 1500);
        }
        break;
      }

      case "submitAnswer": {
        if (!game || game.state !== "question") return;
        const player = game.players.get(ws.nickname);
        if (!player || game.answerMap.has(ws.nickname)) return;

        const elapsed = (Date.now() - game.timerStart) / 1000;
        const timeRemaining = Math.max(0, QUESTION_TIME - elapsed);
        const q = questions[game.questionIndex];
        const isCorrect = msg.answerIndex === q.correct;

        let points = 0;
        if (isCorrect) {
          points = Math.round(MIN_POINTS + (MAX_POINTS - MIN_POINTS) * (timeRemaining / QUESTION_TIME));
          player.streak += 1;
          if (player.streak >= 3) points = Math.round(points * 1.2);
          player.score += points;
        } else {
          player.streak = 0;
        }

        game.answerMap.set(ws.nickname, { index: msg.answerIndex });
        game.answeredCount += 1;

        send(ws, { type: "answerAck", isCorrect, points, score: player.score, streak: player.streak });
        send(game.hostWs, { type: "answerProgress", answeredCount: game.answeredCount, totalPlayers: game.players.size });

        if (game.answeredCount >= game.players.size) {
          clearInterval(game.timer);
          revealAnswer();
        }
        break;
      }
    }
  });

  ws.on("close", () => {
    if (!game) return;
    if (ws.role === "player" && ws.nickname) {
      game.players.delete(ws.nickname);
      send(game.hostWs, { type: "playerLeft", nickname: ws.nickname, playerCount: game.players.size });
      console.log(`${ws.nickname} disconnected`);
    } else if (ws.role === "host") {
      clearInterval(game.timer);
      broadcast({ type: "hostLeft" });
      game = null;
      console.log("Host disconnected — game closed");
    }
  });
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) { ws.terminate(); return; }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

app.get("/api/questions", (req, res) => res.json(questions));
app.use(express.static(path.join(__dirname, "public")));
app.get("/host", (req, res) => res.sendFile(path.join(__dirname, "public", "host.html")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

server.listen(PORT, () => {
  console.log(`\n🐟 SuperKlitjeQuiz running on http://localhost:${PORT}`);
  console.log(`   Host:   http://localhost:${PORT}/host`);
  console.log(`   Speler: http://localhost:${PORT}/\n`);
});
