# DocForge Server

AI-Powered Documentation Generator — Server Side

## Setup

```bash
# Create virtual environment
uv venv
source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your API key

# Run server
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Environment Variables

```bash
# AI Provider (pick one)
OPENROUTER_API_KEY=sk-or-...    # Recommended - OpenRouter supports Claude, GPT, etc
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Server settings
HOST=0.0.0.0
PORT=8000

# Model settings
MODEL=anthropic/claude-3-haiku  # Default model
MAX_TOKENS=4000
TEMPERATURE=0.7

# Rate limiting
RATE_LIMIT_PER_MINUTE=10
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
      {
        "path": "src/index.js",
        "content": "const express = require(\"express\")...",
        "language": "javascript"
      }
    ],
    "options": {
      "include_readme": true,
      "include_api": true,
      "include_architecture": false
    }
  }'
```

### `POST /generate-from-repo`

Clone a git repository and generate documentation.

```bash
curl -X POST http://localhost:8000/generate-from-repo \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/user/repo",
    "branch": "main",
    "include_patterns": ["*.js", "*.ts", "*.py"],
    "exclude_patterns": ["node_modules/**", "*.test.js"]
  }'
```

### `GET /health`

Health check endpoint.

```bash
curl http://localhost:8000/health
```

## Docker

```bash
# Build
docker build -t docforge-server .

# Run
docker run -p 8000:8000 \
  -e OPENROUTER_API_KEY=sk-or-... \
  docforge-server
```

## Project Structure

```
server/
├── main.py              # FastAPI entry point
├── config.py             # Environment configuration
├── requirements.txt
├── routes/
│   ├── generate.py       # POST /generate
│   ├── repo.py           # POST /generate-from-repo
│   └── health.py         # GET /health
├── services/
│   ├── ai_provider.py   # OpenRouter/OpenAI/Anthropic abstraction
│   ├── doc_generator.py # Prompt building + parsing
│   └── repo_downloader.py
├── models/
│   └── schemas.py        # Pydantic models
└── .env.example
```
