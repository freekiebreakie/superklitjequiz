/* ── SuperKlitjeQuiz Host ──────────────────────────────────────────── */

const FISH_EMOJIS = ["🐟", "🐠", "🐡", "🦈", "🐬", "🦑", "🦐", "🦀", "🐙", "🐳"];
const ANSWER_FISH = ["🦈", "🐡", "🐠", "🐟"];
const HOST_CIRCUMFERENCE = 2 * Math.PI * 45; // r=45
const TOTAL_TIME = 20;

let ws = null;
let totalPlayers = 0;
let currentAnswers = [];
let currentTotal = 0;

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
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function playJingle() {
  const notes = [500, 700, 900, 1100];
  notes.forEach((f, i) => setTimeout(() => playBlop(f, 0.18), i * 100));
}

// ── Bubbles ─────────────────────────────────────────────────────────────
const canvas = document.getElementById("bubble-canvas");
const bctx = canvas.getContext("2d");
const bubbles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

for (let i = 0; i < 35; i++) {
  bubbles.push({
    x: Math.random() * window.innerWidth,
    y: window.innerHeight + Math.random() * 400,
    r: 4 + Math.random() * 18,
    speed: 0.3 + Math.random() * 0.9,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.015 + Math.random() * 0.025,
    opacity: 0.06 + Math.random() * 0.14,
  });
}

function drawBubbles() {
  bctx.clearRect(0, 0, canvas.width, canvas.height);
  bubbles.forEach((b) => {
    b.y -= b.speed;
    b.wobble += b.wobbleSpeed;
    b.x += Math.sin(b.wobble) * 0.7;
    if (b.y + b.r < 0) {
      b.y = canvas.height + b.r;
      b.x = Math.random() * canvas.width;
    }
    bctx.beginPath();
    bctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    bctx.strokeStyle = `rgba(0,245,255,${b.opacity})`;
    bctx.lineWidth = 1.5;
    bctx.stroke();
    bctx.beginPath();
    bctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
    bctx.fillStyle = `rgba(255,255,255,${b.opacity * 0.5})`;
    bctx.fill();
  });
  requestAnimationFrame(drawBubbles);
}
drawBubbles();

// ── Fish swimming ────────────────────────────────────────────────────────
function spawnFish() {
  const el = document.createElement("div");
  el.className = "fish-lane" + (Math.random() > 0.5 ? " reverse" : "");
  el.textContent = FISH_EMOJIS[Math.floor(Math.random() * FISH_EMOJIS.length)];
  el.style.top = (5 + Math.random() * 90) + "%";
  const dur = 10 + Math.random() * 14;
  el.style.animationDuration = dur + "s";
  el.style.fontSize = (28 + Math.random() * 36) + "px";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), dur * 1000 + 500);
}
setInterval(spawnFish, 2000);
spawnFish();

// ── Fish explosion ────────────────────────────────────────────────────────
function fishExplosion(x, y, count = 20) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.textContent = FISH_EMOJIS[Math.floor(Math.random() * FISH_EMOJIS.length)];
    const angle = (i / count) * Math.PI * 2;
    const dist = 100 + Math.random() * 200;
    p.style.setProperty("--tx", `translateX(${Math.cos(angle) * dist}px) translateY(${Math.sin(angle) * dist}px)`);
    p.style.setProperty("--rot", `${(Math.random() - 0.5) * 900}deg`);
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.style.fontSize = (20 + Math.random() * 24) + "px";
    p.style.animationDelay = Math.random() * 0.2 + "s";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1600);
  }
}

// ── Screen management ─────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".host-screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ── WebSocket ─────────────────────────────────────────────────────────────
function connect(onOpen) {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${proto}//${location.host}`);
  ws.onopen = onOpen;
  ws.onmessage = (evt) => handleMessage(JSON.parse(evt.data));
  ws.onclose = () => alert("Verbinding verbroken! Herlaad de pagina.");
}

function sendMsg(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

// ── Preview ───────────────────────────────────────────────────────────────
async function openPreview() {
  const list = document.getElementById("preview-list");
  list.innerHTML = `<div style="text-align:center;color:var(--cyan);font-family:'Fredoka One',cursive;font-size:20px;">Laden…</div>`;
  showScreen("hscreen-preview");

  const questions = await fetch("/api/questions").then((r) => r.json());
  document.getElementById("preview-count").textContent = questions.length;

  const letters = ["A", "B", "C", "D"];
  const ansColors = ["#c0392b", "#1565c0", "#b7950b", "#1a7a4a"];
  const ansColorsBright = ["#e83030", "#1a9fff", "#f0c40b", "#2dcb75"];

  list.innerHTML = questions.map((q, qi) => {
    const answersHtml = q.answers.map((ans, ai) => {
      const isCorrect = ai === q.correct;
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;
                    background:${isCorrect ? "rgba(0,255,136,0.15)" : `linear-gradient(135deg,${ansColors[ai]}55,${ansColorsBright[ai]}33)`};
                    border:1.5px solid ${isCorrect ? "var(--green)" : "rgba(255,255,255,0.1)"};
                    font-family:'Fredoka One',cursive;font-size:15px;line-height:1.3;">
          <span style="flex-shrink:0;font-size:1.2em;">${ANSWER_FISH[ai]}</span>
          <span style="flex-shrink:0;opacity:0.8;">${letters[ai]}.</span>
          <span style="flex:1;">${escHtml(ans)}</span>
          ${isCorrect ? `<span style="flex-shrink:0;font-size:1.3em;">✅</span>` : ""}
        </div>`;
    }).join("");

    return `
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(0,245,255,0.12);
                  border-radius:18px;padding:18px 20px;display:flex;gap:16px;align-items:flex-start;">
        ${q.photo
          ? `<img src="${q.photo}" style="width:80px;height:80px;object-fit:cover;border-radius:12px;
                                          border:2px solid rgba(0,245,255,0.3);flex-shrink:0;">`
          : ""}
        <div style="flex:1;min-width:0;">
          <div style="font-family:'Fredoka One',cursive;font-size:13px;color:var(--cyan);
                      opacity:0.7;margin-bottom:6px;letter-spacing:1px;">VRAAG ${qi + 1}</div>
          <div style="font-family:'Fredoka One',cursive;font-size:17px;color:#fff;
                      line-height:1.35;margin-bottom:12px;">${escHtml(q.question)}</div>
          <div style="display:flex;flex-direction:column;gap:6px;">${answersHtml}</div>
        </div>
      </div>`;
  }).join("");
}

// ── Game actions ──────────────────────────────────────────────────────────
function createGame() {
  if (actx && actx.state === "suspended") actx.resume();
  connect(() => sendMsg({ type: "createGame" }));
}

function startGame() {
  playJingle();
  sendMsg({ type: "startGame" });
}

function nextQuestion() {
  playBlop(600, 0.15);
  sendMsg({ type: "nextQuestion" });
}

// ── Message handler ───────────────────────────────────────────────────────
function handleMessage(msg) {
  switch (msg.type) {

    case "gameCreated": {
      document.getElementById("host-join-url").textContent =
        `${location.protocol}//${location.hostname}${location.port ? ":" + location.port : ""}`;
      document.getElementById("host-player-count").textContent = "0";
      showScreen("hscreen-lobby");
      break;
    }

    case "playerJoined": {
      totalPlayers = msg.playerCount;
      document.getElementById("host-player-count").textContent = totalPlayers;
      const grid = document.getElementById("host-player-grid");
      const chip = document.createElement("div");
      chip.className = "player-chip";
      chip.id = "chip-" + msg.nickname.replace(/[^a-zA-Z0-9]/g, "_");
      chip.textContent = `${FISH_EMOJIS[Math.floor(Math.random() * 5)]} ${msg.nickname}`;
      grid.appendChild(chip);
      playBlop(400 + Math.random() * 300, 0.1);
      break;
    }

    case "playerLeft": {
      totalPlayers = msg.playerCount;
      document.getElementById("host-player-count").textContent = totalPlayers;
      const id = "chip-" + msg.nickname.replace(/[^a-zA-Z0-9]/g, "_");
      const chip = document.getElementById(id);
      if (chip) chip.remove();
      break;
    }

    case "questionStart": {
      currentAnswers = msg.answers;
      currentTotal = msg.total;

      document.getElementById("host-q-num").textContent =
        `Vraag ${msg.questionIndex + 1} / ${msg.total}`;
      document.getElementById("host-player-num").textContent = totalPlayers;
      document.getElementById("host-answered").textContent = "0";
      document.getElementById("host-total-players").textContent = totalPlayers;
      document.getElementById("host-question-text").textContent = msg.question;
      document.getElementById("host-progress-bar").style.width = "0%";

      // Photo
      const qPhoto = document.getElementById("host-question-photo");
      if (msg.photo) {
        qPhoto.src = msg.photo;
        qPhoto.style.display = "block";
      } else {
        qPhoto.style.display = "none";
      }

      // Build answer cards
      const grid = document.getElementById("host-answers-grid");
      const letters = ["A", "B", "C", "D"];
      const classes = ["a", "b", "c", "d"];
      grid.innerHTML = msg.answers.map((ans, i) => `
        <div class="host-answer-card ${classes[i]}" id="host-ans-${i}">
          <span style="font-size:1.4em;">${ANSWER_FISH[i]}</span>
          <span style="font-size:1.1em;opacity:0.9;">${letters[i]}.</span>
          <span>${escHtml(ans)}</span>
        </div>
      `).join("");

      // Reset timer
      const arc = document.getElementById("host-timer-arc");
      arc.style.strokeDashoffset = "0";
      arc.style.stroke = "var(--cyan)";
      document.getElementById("host-timer-num").textContent = TOTAL_TIME;
      document.getElementById("host-timer-num").style.color = "var(--cyan)";

      showScreen("hscreen-question");
      break;
    }

    case "tick": {
      const arc = document.getElementById("host-timer-arc");
      const num = document.getElementById("host-timer-num");
      const t = msg.timeLeft;
      num.textContent = t;
      arc.style.strokeDashoffset = HOST_CIRCUMFERENCE * (1 - t / TOTAL_TIME);
      if (t <= 5) {
        arc.style.stroke = "var(--red)";
        num.style.color = "var(--red)";
        playBlop(250 + t * 20, 0.07);
      } else if (t <= 10) {
        arc.style.stroke = "var(--yellow)";
        num.style.color = "var(--yellow)";
      }
      break;
    }

    case "answerProgress": {
      const answered = msg.answeredCount;
      const total = msg.totalPlayers;
      document.getElementById("host-answered").textContent = answered;
      document.getElementById("host-total-players").textContent = total;
      const pct = total > 0 ? (answered / total) * 100 : 0;
      document.getElementById("host-progress-bar").style.width = pct + "%";
      playBlop(400, 0.06);
      break;
    }

    case "answerReveal": {
      const correctIdx = msg.correctIndex;
      const correctText = currentAnswers[correctIdx] || "";
      const letters = ["A", "B", "C", "D"];
      const voteCounts = msg.voteCounts || [];
      const maxVotes = Math.max(1, ...voteCounts);
      const totalVotes = voteCounts.reduce((s, v) => s + v, 0);

      // Reveal on question screen answer cards
      currentAnswers.forEach((_, i) => {
        const card = document.getElementById(`host-ans-${i}`);
        if (card) {
          card.classList.add(i === correctIdx ? "correct" : "wrong");
        }
      });

      // Build reveal screen
      document.getElementById("reveal-correct-label").textContent =
        `✅ ${letters[correctIdx]}. ${correctText}`;

      const revPhoto = document.getElementById("reveal-photo");
      if (msg.photo) {
        revPhoto.src = msg.photo;
        revPhoto.style.display = "block";
      } else {
        revPhoto.style.display = "none";
      }

      const classes = ["a", "b", "c", "d"];
      document.getElementById("reveal-answers-grid").innerHTML = currentAnswers.map((ans, i) => {
        const votes = voteCounts[i] || 0;
        const pct = Math.round((votes / maxVotes) * 100);
        const votePct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        return `
          <div class="host-answer-card ${classes[i]} ${i === correctIdx ? "correct" : "wrong"}" style="flex-direction:column;align-items:stretch;gap:8px;">
            <div style="display:flex;align-items:center;gap:8px;min-width:0;">
              <span style="font-size:1.3em;flex-shrink:0;">${ANSWER_FISH[i]}</span>
              <span style="opacity:0.9;flex-shrink:0;">${letters[i]}.</span>
              <span style="overflow-wrap:break-word;word-break:normal;min-width:0;flex:1;">${escHtml(ans)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="flex:1;background:rgba(0,0,0,0.3);border-radius:6px;height:10px;overflow:hidden;">
                <div style="height:100%;border-radius:6px;width:${pct}%;background:${i === correctIdx ? "var(--green)" : "rgba(255,255,255,0.4)"};transition:width 0.6s ease;"></div>
              </div>
              <span style="font-family:'Fredoka One',cursive;font-size:0.9em;white-space:nowrap;flex-shrink:0;">${votes} (${votePct}%)</span>
            </div>
          </div>
        `;
      }).join("");

      buildLeaderboard(msg.leaderboard, "reveal-leaderboard");

      const nextBtn = document.getElementById("next-btn");
      nextBtn.textContent = msg.isLast ? "EINDSTAND 🏆" : "VOLGENDE VRAAG ➡️";

      fishExplosion(window.innerWidth / 2, window.innerHeight * 0.35, 24);
      playJingle();

      setTimeout(() => showScreen("hscreen-reveal"), 600);
      break;
    }

    case "gameEnd": {
      buildLeaderboard(msg.leaderboard, "host-end-leaderboard");
      buildPodium(msg.leaderboard, "host-podium");
      showScreen("hscreen-end");
      fishExplosion(window.innerWidth / 2, window.innerHeight / 2, 40);
      setTimeout(() => fishExplosion(window.innerWidth * 0.2, window.innerHeight * 0.4, 20), 400);
      setTimeout(() => fishExplosion(window.innerWidth * 0.8, window.innerHeight * 0.4, 20), 700);
      const jingle = [400, 600, 800, 1000, 1200, 900, 1100];
      jingle.forEach((f, i) => setTimeout(() => playBlop(f, 0.2), i * 120));
      break;
    }

    case "error": {
      alert(msg.message);
      break;
    }
  }
}

// ── Render helpers ────────────────────────────────────────────────────────
function buildLeaderboard(entries, containerId) {
  const el = document.getElementById(containerId);
  const rankEmojis = ["🥇", "🥈", "🥉"];
  el.innerHTML = (entries || []).slice(0, 10).map((p, i) => {
    const fishCount = Math.min(Math.floor(p.score / 300) + 1, 5);
    return `<div class="lb-row" style="animation-delay:${i * 0.06}s">
      <span class="lb-rank">${rankEmojis[i] || (i + 1)}</span>
      <span class="lb-fish">${"🐟".repeat(fishCount)}</span>
      <span class="lb-name">${escHtml(p.nickname)}</span>
      <span class="lb-score">${p.score.toLocaleString()}</span>
    </div>`;
  }).join("");
}

function buildPodium(entries, containerId) {
  const el = document.getElementById(containerId);
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) { el.innerHTML = ""; return; }
  const order = top3.length >= 2 ? [top3[1], top3[0], top3[2]].filter(Boolean) : [top3[0]];
  const classes = top3.length >= 2 ? ["second", "first", "third"] : ["first"];
  const nums = top3.length >= 2 ? [2, 1, 3] : [1];
  const avatars = ["🥈", "🥇", "🥉"];

  el.innerHTML = order.map((p, i) => `
    <div class="podium-place">
      <div class="podium-avatar">${avatars[i]}</div>
      <div class="podium-name">${escHtml(p.nickname)}</div>
      <div class="podium-score">${p.score.toLocaleString()} pts</div>
      <div class="podium-block ${classes[i]}">${nums[i]}</div>
    </div>
  `).join("");
}

function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
