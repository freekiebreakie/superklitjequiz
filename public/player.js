/* ── SuperKlitjeQuiz Player ────────────────────────────────────────── */

const FISH_EMOJIS = ["🐟", "🐠", "🐡", "🦈", "🐬", "🦑", "🦐", "🦀", "🐙", "🐳"];
const ANSWER_FISH = ["🦈", "🐡", "🐠", "🐟"];
const CIRCUMFERENCE = 2 * Math.PI * 35; // r=35
const TOTAL_TIME = 20;

let ws = null;
let nickname = "";
let hasAnswered = false;

// ── Audio ──────────────────────────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;

function getAudioCtx() {
  if (!actx) actx = new AudioCtx();
  return actx;
}

function playBlop(freq = 400, duration = 0.12) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function playCorrect() {
  [500, 700, 900].forEach((f, i) => setTimeout(() => playBlop(f, 0.15), i * 80));
}
function playWrong() {
  [300, 220].forEach((f, i) => setTimeout(() => playBlop(f, 0.18), i * 100));
}

// ── Bubbles ─────────────────────────────────────────────────────────────
const canvas = document.getElementById("bubble-canvas");
const ctx2d = canvas.getContext("2d");
const bubbles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

for (let i = 0; i < 25; i++) {
  bubbles.push({
    x: Math.random() * window.innerWidth,
    y: window.innerHeight + Math.random() * 300,
    r: 3 + Math.random() * 12,
    speed: 0.4 + Math.random() * 1.2,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.02 + Math.random() * 0.03,
    opacity: 0.08 + Math.random() * 0.18,
  });
}

function drawBubbles() {
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  bubbles.forEach((b) => {
    b.y -= b.speed;
    b.wobble += b.wobbleSpeed;
    b.x += Math.sin(b.wobble) * 0.6;
    if (b.y + b.r < 0) {
      b.y = canvas.height + b.r;
      b.x = Math.random() * canvas.width;
    }
    ctx2d.beginPath();
    ctx2d.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx2d.strokeStyle = `rgba(0,245,255,${b.opacity})`;
    ctx2d.lineWidth = 1.5;
    ctx2d.stroke();
    // highlight
    ctx2d.beginPath();
    ctx2d.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
    ctx2d.fillStyle = `rgba(255,255,255,${b.opacity * 0.6})`;
    ctx2d.fill();
  });
  requestAnimationFrame(drawBubbles);
}
drawBubbles();

// ── Fish swimming ────────────────────────────────────────────────────────
function spawnFish() {
  const el = document.createElement("div");
  el.className = "fish-lane" + (Math.random() > 0.5 ? " reverse" : "");
  el.textContent = FISH_EMOJIS[Math.floor(Math.random() * FISH_EMOJIS.length)];
  const topPct = 10 + Math.random() * 80;
  el.style.top = topPct + "%";
  const dur = 8 + Math.random() * 12;
  el.style.animationDuration = dur + "s";
  el.style.fontSize = (20 + Math.random() * 28) + "px";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), dur * 1000 + 500);
}
setInterval(spawnFish, 2500);
spawnFish();

// ── Gezicht sneeuwstorm ───────────────────────────────────────────────────
function gezichtSneeuwstorm(count = 20) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement("img");
      el.src = "gezicht.jpeg";
      el.className = "gezicht-flake";
      const size = 45 + Math.random() * 70;
      const dur = 1.8 + Math.random() * 2;
      const dx = (Math.random() - 0.5) * 160;
      const rot = (Math.random() - 0.5) * 900;
      const scale = 0.7 + Math.random() * 0.8;
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.left = (Math.random() * window.innerWidth) + "px";
      el.style.top = (-size - 10) + "px";
      el.style.opacity = "0";
      document.body.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = `top ${dur}s linear, transform ${dur}s linear, opacity 0.25s`;
        el.style.top = (window.innerHeight + size + 20) + "px";
        el.style.transform = `translateX(${dx}px) rotate(${rot}deg) scale(${scale})`;
        el.style.opacity = "1";
      }));
      setTimeout(() => { el.style.opacity = "0"; }, (dur - 0.3) * 1000);
      setTimeout(() => el.remove(), dur * 1000 + 300);
    }, i * 80);
  }
}

// ── Bamischijf ────────────────────────────────────────────────────────────
function launchBamischijven(count = 3) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement("img");
      el.src = "bamischijf.jpg";
      el.className = "bamischijf";
      const fromRight = Math.random() > 0.5;
      const startX = fromRight ? window.innerWidth + 40 : -120;
      const startY = 80 + Math.random() * (window.innerHeight - 200);
      const dx = fromRight ? -(window.innerWidth + 200) : (window.innerWidth + 200);
      const dy = (Math.random() - 0.5) * 300;
      const rot = (Math.random() - 0.5) * 720;
      const dur = 1.4 + Math.random() * 0.8;
      el.style.left = startX + "px";
      el.style.top = startY + "px";
      el.style.setProperty("--bami-dx", dx + "px");
      el.style.setProperty("--bami-dy", dy + "px");
      el.style.setProperty("--bami-rot", rot + "deg");
      el.style.animationDuration = dur + "s";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), dur * 1000 + 100);
    }, i * 200);
  }
}

// ── Fish explosion ────────────────────────────────────────────────────────
function fishExplosion(x, y) {
  for (let i = 0; i < 14; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.textContent = FISH_EMOJIS[Math.floor(Math.random() * FISH_EMOJIS.length)];
    const angle = (i / 14) * Math.PI * 2;
    const dist = 80 + Math.random() * 140;
    const tx = `translateX(${Math.cos(angle) * dist}px) translateY(${Math.sin(angle) * dist}px)`;
    const rot = (Math.random() - 0.5) * 720 + "deg";
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.style.setProperty("--tx", tx);
    p.style.setProperty("--rot", rot);
    p.style.animationDelay = Math.random() * 0.15 + "s";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1400);
  }
}

// ── Screen management ─────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  // Unlock audio on first interaction
  if (actx && actx.state === "suspended") actx.resume();
}

// ── WebSocket connection ──────────────────────────────────────────────────
function connect(onOpen) {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${proto}//${location.host}`);
  ws.onopen = onOpen;
  ws.onmessage = (evt) => handleMessage(JSON.parse(evt.data));
  ws.onclose = () => {
    if (document.getElementById("screen-end").classList.contains("active")) return;
    showScreen("screen-disconnected");
  };
}

function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

// ── Join ──────────────────────────────────────────────────────────────────
function joinGame() {
  const nameEl = document.getElementById("nickname-input");
  const errEl = document.getElementById("join-error");
  errEl.textContent = "";

  const name = nameEl.value.trim();
  if (!name) { errEl.textContent = "Voer een naam in."; return; }

  nickname = name;
  connect(() => {
    send({ type: "joinGame", nickname: name });
  });
}

// Allow Enter key to join
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.getElementById("screen-join").classList.contains("active")) {
    joinGame();
  }
});

// ── Message handler ───────────────────────────────────────────────────────
function handleMessage(msg) {
  switch (msg.type) {

    case "error": {
      document.getElementById("join-error").textContent = msg.message;
      playWrong();
      break;
    }

    case "joinedGame": {
      nickname = msg.nickname;
      document.getElementById("lobby-name").textContent = msg.nickname;
      playBlop(600, 0.15);
      showScreen("screen-lobby");
      break;
    }

    case "gameStarting": {
      playBlop(800, 0.2);
      break;
    }

    case "questionStart": {
      hasAnswered = false;
      currentTotalPlayers = msg.total || 1;
      renderQuestion(msg);
      showScreen("screen-question");
      break;
    }

    case "tick": {
      updateTimer(msg.timeLeft);
      if (msg.timeLeft <= 5) playBlop(300 + msg.timeLeft * 30, 0.08);
      break;
    }

    case "answerAck": {
      renderAnswerFeedback(msg);
      showScreen("screen-answer-wait");
      break;
    }

    case "answerReveal": {
      launchBamischijven(3);
      gezichtSneeuwstorm(20);
      if (!hasAnswered) {
        // Timed out — show sad feedback
        const box = document.getElementById("answer-feedback-box");
        box.innerHTML = `
          <div class="feedback-icon">⏰</div>
          <div class="feedback-points" style="color:var(--red);">Te laat!</div>
          <div class="feedback-score">+0 punten</div>
        `;
        playWrong();
        showScreen("screen-answer-wait");
      }
      setTimeout(() => {
        renderLeaderboard(msg.leaderboard);
        showScreen("screen-leaderboard");
      }, 2000);
      break;
    }

    case "getReady": {
      playBlop(500, 0.12);
      break;
    }

    case "gameEnd": {
      renderEndScreen(msg.leaderboard);
      showScreen("screen-end");
      break;
    }

    case "hostLeft": {
      showScreen("screen-disconnected");
      break;
    }
  }
}

// ── Render helpers ────────────────────────────────────────────────────────
function renderQuestion(msg) {
  const grid = document.getElementById("answers-grid");
  const qNum = document.getElementById("q-number");
  qNum.textContent = `VRAAG ${msg.questionIndex + 1} / ${msg.total}`;

  const letters = ["A", "B", "C", "D"];
  const classes = ["a", "b", "c", "d"];

  // Question photo
  const qPhoto = document.getElementById("question-photo");
  if (msg.photo) {
    qPhoto.src = msg.photo;
    qPhoto.style.display = "block";
  } else {
    qPhoto.style.display = "none";
  }

  // Question text
  const qText = document.getElementById("player-question-text");
  if (msg.question) {
    qText.textContent = msg.question;
    qText.style.display = "block";
  } else {
    qText.style.display = "none";
  }

  grid.innerHTML = "";
  msg.answers.forEach((ans, i) => {
    const btn = document.createElement("button");
    btn.className = `answer-btn ${classes[i]}`;
    btn.dataset.index = i;
    btn.innerHTML = `
      <span class="fish-icon">${ANSWER_FISH[i]}</span>
      <span class="letter">${letters[i]}.</span>
      <span>${ans}</span>
    `;
    btn.addEventListener("click", () => submitAnswer(i, btn));
    grid.appendChild(btn);
  });

  // Reset timer arc
  const arc = document.getElementById("timer-arc");
  arc.style.strokeDashoffset = "0";
  arc.style.stroke = "var(--cyan)";
  document.getElementById("timer-num").textContent = TOTAL_TIME;
}

function submitAnswer(index, btn) {
  if (hasAnswered) return;
  hasAnswered = true;
  playBlop(500 + index * 50, 0.12);

  // Disable all buttons
  document.querySelectorAll(".answer-btn").forEach((b) => {
    b.disabled = true;
    if (b !== btn) b.style.opacity = "0.4";
  });
  btn.style.boxShadow = "0 0 0 4px white";

  send({ type: "submitAnswer", answerIndex: index });
}

function renderAnswerFeedback(msg) {
  const box = document.getElementById("answer-feedback-box");
  if (msg.isCorrect) {
    playCorrect();
    fishExplosion(window.innerWidth / 2, window.innerHeight / 2);
    const streakText = msg.streak >= 3
      ? `<div style="color:var(--yellow);font-size:18px;">🔥 ${msg.streak}x streak! +bonus</div>`
      : "";
    box.innerHTML = `
      <div class="feedback-icon">✅</div>
      <div class="feedback-points">+${msg.points.toLocaleString()}</div>
      <div class="feedback-score">Totaal: ${msg.score.toLocaleString()} punten</div>
      ${streakText}
    `;
  } else {
    playWrong();
    box.innerHTML = `
      <div class="feedback-icon">❌</div>
      <div class="feedback-points" style="color:var(--red);">Fout!</div>
      <div class="feedback-score">Totaal: ${msg.score.toLocaleString()} punten</div>
    `;
  }
}

function updateTimer(timeLeft) {
  const arc = document.getElementById("timer-arc");
  const num = document.getElementById("timer-num");
  num.textContent = timeLeft;
  const offset = CIRCUMFERENCE * (1 - timeLeft / TOTAL_TIME);
  arc.style.strokeDashoffset = offset;
  if (timeLeft <= 5) {
    arc.style.stroke = "var(--red)";
    num.style.color = "var(--red)";
  } else if (timeLeft <= 10) {
    arc.style.stroke = "var(--yellow)";
    num.style.color = "var(--yellow)";
  }
}

function renderLeaderboard(entries) {
  const container = document.getElementById("leaderboard-list");
  const rankEmojis = ["🥇", "🥈", "🥉"];
  container.innerHTML = entries.slice(0, 10).map((p, i) => {
    const fishCount = Math.min(Math.floor(p.score / 300) + 1, 5);
    const fish = "🐟".repeat(fishCount);
    const isMe = p.nickname === nickname;
    return `<div class="lb-row" style="${isMe ? "border-color:var(--cyan);background:rgba(0,245,255,0.1);" : ""}" style="animation-delay:${i * 0.08}s">
      <span class="lb-rank">${rankEmojis[i] || (i + 1)}</span>
      <span class="lb-fish">${fish}</span>
      <span class="lb-name">${escHtml(p.nickname)}${isMe ? " 👈" : ""}</span>
      <span class="lb-score">${p.score.toLocaleString()}</span>
    </div>`;
  }).join("");
}

function renderEndScreen(entries) {
  renderLeaderboard(entries);
  // Reuse leaderboard for end-leaderboard
  const endLb = document.getElementById("end-leaderboard");
  endLb.innerHTML = document.getElementById("leaderboard-list").innerHTML;

  const podium = document.getElementById("podium-display");
  const top3 = entries.slice(0, 3);
  const order = top3.length >= 2 ? [top3[1], top3[0], top3[2]].filter(Boolean) : top3;
  const classes = top3.length >= 2 ? ["second", "first", "third"] : ["first"];
  const nums = top3.length >= 2 ? [2, 1, 3] : [1];
  const avatars = ["🥈", "🥇", "🥉"];

  podium.innerHTML = order.map((p, i) => `
    <div class="podium-place">
      <div class="podium-avatar">${avatars[i]}</div>
      <div class="podium-name">${escHtml(p.nickname)}</div>
      <div class="podium-score">${p.score.toLocaleString()} pts</div>
      <div class="podium-block ${classes[i]}">${nums[i]}</div>
    </div>
  `).join("");

  // Special celebration if you're in top 3
  if (entries.slice(0, 3).some((p) => p.nickname === nickname)) {
    fishExplosion(window.innerWidth / 2, window.innerHeight / 2);
    setTimeout(() => fishExplosion(window.innerWidth * 0.25, window.innerHeight * 0.5), 500);
    setTimeout(() => fishExplosion(window.innerWidth * 0.75, window.innerHeight * 0.5), 800);
  }
}

function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
