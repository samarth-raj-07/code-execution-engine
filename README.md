# ⚡ Code Execution Engine

A production-grade distributed code execution engine inspired by LeetCode's judge system. Runs user-submitted code in isolated Docker containers with CPU/memory limits, async job queuing, and real-time output streaming.

<img width="1587" height="716" alt="image" src="https://github.com/user-attachments/assets/ee7f664b-5f78-4bdd-b22b-911c8ffbd622" />

---

## 🚀 Features

- **Multi-language support** — Python, JavaScript, C++
- **Isolated sandboxes** — Each submission runs in a fresh ephemeral Docker container
- **Security hardened** — Network disabled, 50MB memory cap, CPU quota, 5s timeout per container
- **Async job queue** — Redis + BullMQ with retry and exponential backoff
- **Stdin support** — Pass custom input to your programs
- **Rate limiting** — 5 submissions per minute per IP
- **Submission history** — PostgreSQL-backed history with execution times
- **Monaco Editor** — The same editor powering VS Code

---

## 🏗️ Architecture
User → React UI → Express API → Redis Queue → BullMQ Worker → Docker Container → Output
↓                                              ↓
PostgreSQL                                    PostgreSQL
(store pending)                              (store result)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Monaco Editor, Tailwind CSS |
| Backend | Node.js, Express |
| Job Queue | Redis, BullMQ |
| Execution | Docker, Dockerode |
| Database | PostgreSQL |
| Infrastructure | Docker Compose |

---

## ⚙️ How It Works

1. User submits code via the Monaco editor
2. API saves submission to PostgreSQL with `pending` status
3. Job is pushed to Redis queue via BullMQ
4. Worker picks up the job and spawns a Docker container
5. Code is base64 encoded and executed inside the isolated container
6. Output is captured via Docker log stream
7. Result is saved back to PostgreSQL
8. Frontend polls for result and displays output

---
<img width="1571" height="710" alt="image" src="https://github.com/user-attachments/assets/92205d98-740b-47c8-8d02-ddead0b8a3a8" />

## 🔒 Security

Each code submission is isolated with:
- A **fresh ephemeral container** (destroyed after execution)
- **Network disabled** — no outbound internet access
- **50MB memory limit** — prevents memory bombs
- **CPU quota** — 50% of one core maximum
- **5 second timeout** — kills infinite loops automatically

---

## 🚦 Getting Started

### Prerequisites
- Docker + Docker Compose
- Node.js 18+

### Run Locally

```bash
# Clone the repo
git clone https://github.com/samarth-raj-07/code-execution-engine
cd code-execution-engine

# Pull execution images
docker pull python:3.11-slim
docker pull node:18-slim
docker pull gcc:12

# Start all services
docker compose up --build

# In a new terminal, start the frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## 📸 Screenshots

> Add screenshots here after deployment

---

## 📈 Performance

- Median execution latency: **~300ms**
- Supports concurrent submissions via async queue
- Auto-retry on failure with exponential backoff


## 👤 Author

**Samarth Raj** — [GitHub](https://github.com/samarth-raj-07)
