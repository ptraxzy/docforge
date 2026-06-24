# DocForge Server

**AI-Powered Documentation Generator - Open Source**

DocForge is a FastAPI-based server that uses AI to automatically generate comprehensive documentation from source code. It supports any OpenAI-compatible AI endpoint, including self-hosted solutions like Ollama, vLLM, and LM Studio.

## Features

- **Multi-language support**: JavaScript, TypeScript, Python, Go, Rust, Java, PHP, Ruby, C/C++, C#, Kotlin, Swift
- **Flexible AI integration**: Works with any OpenAI-compatible API endpoint
- **Repository support**: Clone and document Git repositories directly
- **Rate limiting**: Built-in IP-based rate limiting to prevent abuse
- **CORS enabled**: Ready for frontend integration
- **Configurable generation**: Choose which documentation files to generate (README, API, Architecture, Changelog)

## Quick Start

### Prerequisites

- Python 3.10+
- An AI provider (Ollama, OpenAI, OpenRouter, etc.)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd server

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

### Configuration

Create a `.env` file or set environment variables:

```env
# AI Provider (OpenAI-compatible endpoint)
AI_BASE_URL=http://localhost:11434/v1
AI_API_KEY=optional-api-key
AI_MODEL=llama3

# Generation settings
MAX_TOKENS=4000
TEMPERATURE=0.7

# Server
HOST=0.0.0.0
PORT=8000

# Rate limiting
RATE_LIMIT_PER_MINUTE=10

# CORS
CORS_ORIGINS=*
```

### Running the Server

```bash
# With uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# With environment variables
AI_BASE_URL=http://localhost:11434/v1 AI_MODEL=llama3 uvicorn main:app
```

## Supported AI Providers

DocForge works with any OpenAI-compatible API endpoint:

| Provider | Base URL | Notes |
|----------|----------|-------|
| Ollama | `http://localhost:11434/v1` | Self-hosted, free |
| LM Studio | `http://localhost:1234/v1` | Local model serving |
| vLLM | `http://localhost:8000/v1` | High-performance inference |
| OpenAI | `https://api.openai.com/v1` | Cloud API |
| OpenRouter | `https://openrouter.ai/api/v1` | Multi-provider aggregator |
| Groq | `https://api.groq.com/openai/v1` | Fast inference |

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate` | POST | Generate docs from source code |
| `/generate-from-repo` | POST | Clone repo and generate docs |
| `/health` | GET | Health check with AI status |

## Example Usage

### Generate Documentation from Files

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "my-api",
    "files": [
      {
        "path": "main.py",
        "content": "def hello(): return \"world\"",
        "language": "python"
      }
    ],
    "options": {
      "include_readme": true,
      "include_api": true
    }
  }'
```

### Generate Documentation from Repository

```bash
curl -X POST http://localhost:8000/generate-from-repo \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/user/repo",
    "branch": "main",
    "include_patterns": ["*.py", "*.js"],
    "exclude_patterns": ["node_modules/**", "*_test.py"]
  }'
```

## License

MIT License