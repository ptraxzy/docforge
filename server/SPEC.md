# DocForge Server — Specification

## Overview

FastAPI server that receives code from CLI client, processes with AI, returns generated documentation.

## Tech Stack

- **Framework**: FastAPI (Python)
- **AI Provider**: Any OpenAI-compatible endpoint (Ollama, vLLM, OpenAI, etc.)
- **Config**: Environment variables

## Endpoints

### `POST /generate`

**Request Body:**
```json
{
  "project_name": "my-project",
  "files": [
    {
      "path": "src/index.js",
      "content": "const express = require('express')...",
      "language": "javascript"
    }
  ],
  "git_context": {
    "recent_commits": ["feat: add user auth", "fix: login redirect"],
    "branch": "main"
  },
  "options": {
    "include_readme": true,
    "include_api": true,
    "include_architecture": false,
    "include_changelog": false,
    "include_introduction": false,
    "include_features": false,
    "include_configuration": false
  },
  "framework": "react-vite",
  "existing_docs": {
    "README.md": "# My Project\n\n..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "docs": {
    "README.md": "# My Project\n\n...",
    "API.md": "## Functions\n\n...",
    "ARCHITECTURE.md": "..."
  },
  "metadata": {
    "files_processed": 5,
    "tokens_used": 1200,
    "generated_at": "2025-06-25T00:00:00Z"
  }
}
```

### `POST /generate-from-repo`

**Request Body:**
```json
{
  "repo_url": "https://github.com/user/repo",
  "branch": "main",
  "include_patterns": ["*.js", "*.ts", "*.py"],
  "exclude_patterns": ["node_modules/**", "*.test.js"]
}
```

Downloads repo, analyzes code, generates docs.

### `GET /health`

Health check endpoint with AI provider connectivity status.

## AI Processing Flow

1. Receive code files
2. Build context prompt with file structure + content
3. Send system prompt + user prompt to OpenAI-compatible API
4. Parse AI response into structured docs (JSON)
5. Return markdown outputs

## Environment Variables

```bash
# AI Provider (any OpenAI-compatible endpoint)
AI_BASE_URL=http://localhost:11434/v1
AI_API_KEY=                    # Optional for self-hosted
AI_MODEL=llama3

# Config
PORT=8000
HOST=0.0.0.0
MAX_TOKENS=4000
TEMPERATURE=0.7
RATE_LIMIT_PER_MINUTE=10
MAX_FILE_SIZE=500000
MAX_FILES=100
CORS_ORIGINS=*
LOG_LEVEL=INFO
```

## Error Handling

- Invalid request body → 422 + validation error detail
- File too large → 422 + size limit message
- Too many files → 422 + count limit message
- AI API failure → 400 + descriptive error
- Rate limit → 429 + backoff suggestion
- Server error → 500 + error log

## Request Validation

- Max files per request: 100 (configurable via MAX_FILES)
- Max file size: 500KB per file (configurable via MAX_FILE_SIZE)
- Path traversal prevention (no `..` or absolute paths)
- Repo URL must start with https://, http://, or git@

## Rate Limiting

- Per-IP: 10 requests/minute (configurable via RATE_LIMIT_PER_MINUTE)
- Applied to `/generate` and `/generate-from-repo` endpoints

## Project Structure

```
server/
├── main.py              # FastAPI app entry, middleware, logging
├── config.py            # Env config + validation
├── routes/
│   ├── generate.py      # POST /generate
│   ├── repo.py          # POST /generate-from-repo
│   └── health.py        # GET /health
├── services/
│   ├── ai_provider.py   # Unified OpenAI-compatible client
│   ├── doc_generator.py # Prompt building + parsing
│   └── repo_downloader.py
├── models/
│   └── schemas.py       # Pydantic models + validators
├── Dockerfile
├── .dockerignore
└── requirements.txt
```

## Completed

- [x] Basic FastAPI server setup
- [x] /generate endpoint
- [x] Unified AI provider (OpenAI-compatible)
- [x] System prompt for doc generation
- [x] /generate-from-repo endpoint
- [x] IP-based rate limiting
- [x] Docker support (Dockerfile + docker-compose)
- [x] Health check with AI status
- [x] Request validation & security
- [x] Structured logging
