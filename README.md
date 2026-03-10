# 🐟 SuperKlitjeQuiz

Real-time multiplayer quiz app — Kahoot on Steroids with Fish. Built for the Klitje vrijgezellen quiz.

## Setup

```bash
npm install
node server.js
```

## Usage

1. Open **`http://localhost:3000/host`** on the big screen (TV/projector)
2. Click **"NIEUW SPEL STARTEN"** — you get a 4-digit room code
3. Players open **`http://localhost:3000/`** on their phones, enter the room code + nickname
4. When everyone is in, the host clicks **"START HET SPEL"**
5. Host controls question flow with the **"VOLGENDE VRAAG"** button after each reveal

## Questions

Questions are loaded from `questions.json` (25 questions extracted from `quiz.pptx`).

### Reviewing uncertain answers

18 of 25 answers were guessed by the parser. Run the extractor again to see the summary:

```bash
python3.11 extract_questions.py
```

Edit `questions.json` directly to fix any wrong `"correct"` index (0-based: 0=A, 1=B, 2=C, 3=D).

### Question format

```json
[
  {
    "question": "Wat is de hoofdstad van Frankrijk?",
    "answers": ["Berlijn", "Parijs", "Madrid", "Rome"],
    "correct": 1
  }
]
```

## Scoring

- Correct answer: 100–1000 points (faster = more)
- 3+ correct streak: ×1.2 bonus
- Wrong/no answer: 0 points, streak resets

## Tech stack

- **Backend**: Node.js + Express + `ws` (WebSocket)
- **Frontend**: Vanilla HTML/CSS/JS — no build step
- **Font**: Fredoka One (Google Fonts)
