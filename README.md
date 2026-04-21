# ⚡ Code Execution Engine

A distributed code execution engine inspired by LeetCode's judge system.

## Features
- Multi-language support: Python, JavaScript, C++
- Isolated Docker container per submission
- Redis + BullMQ job queue for async processing
- CPU and memory limits per execution
- 5 second timeout to prevent infinite loops
- Network disabled inside containers for security
- PostgreSQL backed submission history

## Tech Stack
- **Frontend:** React, Monaco Editor, Tailwind CSS
- **Backend:** Node.js, Express
- **Queue:** Redis, BullMQ
- **Execution:** Docker, Dockerode
- **Database:** PostgreSQL
- **Infrastructure:** Docker Compose

## Architecture
User → React UI → Express API → Redis Queue → BullMQ Worker → Docker Container → Output
