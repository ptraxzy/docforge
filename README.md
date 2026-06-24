# DocForge

> AI-Powered Documentation Generator — open source, self-hostable

```
Developer: clone → run → docs auto-generated
Server owner: deploy → profit
```

## Overview

DocForge adalah tools buat generate dokumentasi dari codebase secara otomatis pake AI. Tanpa ribet — developer cukup run satu command, docs langsung keluar.

**Yang bikin beda:**
- CLI simpel, tinggal pake
- AI processing ada di server (bukan di client)
- **Bring your own AI** — pake Ollama, vLLM, OpenAI, atau AI provider apapun
- Open source, bisa self-host
- Developer ga perlu setup API key atau ngerti AI

## Quick Start

### Option 1: Run instantly with npx (Recommended — No Setup)

You don't even need to clone the repository or install anything. Just run:

```bash
npx @ultramaxoo/docforge generate
```

This will automatically scan your code files and generate documentation using our active public VPS backend.

### Option 2: Clone and run locally

If you cloned this repository, you can run it with a single command from the root directory:

```bash
# Clone the repository
git clone https://github.com/ptraxzy/docforge.git
cd docforge

# Generate docs for any project (defaults to current directory)
npm run generate
```

### Option 3: Self-host with Docker (advanced)

```bash
# Clone repo
git clone https://github.com/yourname/docforge
cd docforge

# Start server + Ollama AI
docker compose up -d

# Pull an AI model
docker compose exec ollama ollama pull llama3

# Use the CLI
cd client && npm install -g .
docforge set-server http://localhost:8000
docforge generate ./my-project
```

### Option 3: Self-host manually

```bash
# Clone repo
git clone https://github.com/yourname/docforge

# Start AI server (Ollama example)
ollama serve
ollama pull llama3

# Start DocForge server
cd docforge/server
cp .env.example .env
# Edit .env if needed (defaults work with local Ollama)
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Then in another terminal:

```bash
cd docforge/client
npm install -g .
docforge generate ./my-project
```

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                 DEVELOPER MACHINE                    │
│                                                     │
│   docforge generate ./my-project                    │
│                    │                                │
└────────────────────┼────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────┐
│              DOCFORGE SERVER                         │
│                                                     │
│   - Receives code files                             │
│   - Processes with AI                               │
│   - Returns generated markdown docs                 │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │  AI PROVIDER (your choice)                  │   │
│   │  - Ollama (self-hosted, free)               │   │
│   │  - vLLM / LM Studio (self-hosted)           │   │
│   │  - OpenAI / OpenRouter (cloud)              │   │
│   └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## AI Provider Configuration

DocForge uses the OpenAI-compatible chat completions API. Configure via environment variables:

### Self-hosted (no API key needed)

```bash
# Ollama
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama3

# vLLM
AI_BASE_URL=http://your-gpu-server:8000/v1
AI_MODEL=meta-llama/Llama-3-8b-chat-hf

# LM Studio
AI_BASE_URL=http://localhost:1234/v1
AI_MODEL=local-model
```

### Cloud providers (API key required)

```bash
# OpenAI
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-your_key
AI_MODEL=gpt-4o-mini

# OpenRouter
AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=sk-or-your_key
AI_MODEL=anthropic/claude-3-haiku
```

## Features

- [x] Multi-language support (JS/TS, Python, Go, Java, etc)
- [x] README.md auto-generation
- [x] API reference generation
- [x] Architecture docs generation
- [x] Git context integration (commit messages)
- [x] Simple CLI
- [x] Configurable output directory
- [x] Bring your own AI (Ollama, vLLM, OpenAI, etc)
- [x] IP-based rate limiting
- [x] Docker deployment with docker-compose
- [x] Request validation & security hardening
- [ ] Interactive executable code examples (phase 2)
- [ ] Template customization (phase 2)
- [ ] Git hook integration (phase 2)

## Project Structure

```
docforge/
├── server/                 # FastAPI server (AI processing)
│   ├── main.py             # App entry, middleware, logging
│   ├── config.py           # Environment config + validation
│   ├── routes/
│   │   ├── generate.py     # POST /generate
│   │   ├── repo.py         # POST /generate-from-repo
│   │   └── health.py       # GET /health (with AI status)
│   ├── services/
│   │   ├── ai_provider.py  # Unified OpenAI-compatible client
│   │   ├── doc_generator.py # Prompt building + parsing
│   │   └── repo_downloader.py
│   ├── models/
│   │   └── schemas.py      # Pydantic models + validators
│   ├── Dockerfile
│   ├── .dockerignore
│   └── requirements.txt
│
├── client/                 # Node.js CLI
│   ├── src/
│   │   ├── index.js
│   │   ├── commands/
│   │   └── utils/
│   └── package.json
│
├── docker-compose.yml      # Production deployment
├── .gitignore
└── README.md
```

## API Endpoints

### `POST /generate`

Generate documentation from code files.

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "my-project",
    "files": [
      {"path": "src/index.js", "content": "...", "language": "javascript"}
    ],
    "options": {"include_readme": true, "include_api": true}
  }'
```

### `POST /generate-from-repo`

Clone repo and generate documentation.

```bash
curl -X POST http://localhost:8000/generate-from-repo \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/user/repo",
    "branch": "main",
    "include_patterns": ["*.js", "*.py"]
  }'
```

### `GET /health`

Health check with AI provider status.

```json
{
  "status": "healthy",
  "service": "docforge-server",
  "timestamp": "2025-06-25T00:00:00Z",
  "ai_provider": {
    "status": "connected",
    "base_url": "http://localhost:11434/v1",
    "model": "llama3"
  }
}
```

## Docker Deployment

```bash
# Start everything
docker compose up -d

# Pull AI model
docker compose exec ollama ollama pull llama3

# Check health
curl http://localhost:8000/health

# Using cloud AI instead of Ollama?
# Edit docker-compose.yml: remove ollama service, set AI_BASE_URL
AI_BASE_URL=https://api.openai.com/v1 AI_API_KEY=sk-... docker compose up -d docforge
```

## Tech Stack

**Server:**
- FastAPI (Python)
- Any OpenAI-compatible AI provider

**Client:**
- Node.js (ES Modules)
- Commander.js (CLI)
- Axios (HTTP)

**Deployment:**
- Docker + Docker Compose
- Ollama (default AI provider)

## License

MIT
