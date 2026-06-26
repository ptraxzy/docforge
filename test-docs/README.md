# DocForge

AI-powered documentation generator — open source. DocForge analyzes your source code and automatically generates comprehensive markdown documentation using AI.

## Overview

DocForge is a documentation generator that leverages AI to create professional documentation from your codebase. It supports multiple programming languages, generates various documentation types (README, API reference, architecture docs, changelog), and works with any OpenAI-compatible AI provider.

## Features

- **AI-Powered Generation** — Uses any OpenAI-compatible AI endpoint (Ollama, vLLM, LM Studio, OpenAI, OpenRouter, etc.)
- **Multiple Documentation Types** — Generate README.md, API.md, ARCHITECTURE.md, and CHANGELOG.md
- **Multi-Language Support** — JavaScript, TypeScript, Python, Go, Java, Ruby, PHP, C, C++, C#, Swift, Kotlin, Rust, and more
- **Interactive & CLI Modes** — Use interactive prompts or pass command-line flags
- **Remote Repository Support** — Generate docs directly from GitHub/GitLab URLs
- **File Filtering** — Include/exclude patterns for precise file selection
- **Rate Limiting** — Built-in protection against API abuse
- **Security** — Path traversal prevention, input validation, request size limits

## Architecture

```
docforge/
├── client/                  # Node.js CLI
│   └── src/
│       ├── index.js         # CLI entry point
│       ├── commands/        # Command handlers
│       │   ├── generate.js  # Generate documentation
│       │   ├── init.js      # Initialize project
│       │   └── serve.js     # Local server
│       └── utils/           # Utilities
│           ├── config.js    # Configuration management
│           └── fileScanner.js # Code file scanner
├── server/                  # Python FastAPI backend
│   ├── main.py             # FastAPI application
│   ├── config.py           # Server configuration
│   ├── models/
│   │   └── schemas.py      # Pydantic request/response models
│   ├── routes/
│   │   ├── generate.py     # Documentation generation endpoint
│   │   ├── health.py       # Health check endpoint
│   │   └── repo.py         # Repository-based generation
│   └── services/
│       ├── ai_provider.py      # AI provider integration
│       ├── doc_generator.py    # Documentation generation logic
│       └── repo_downloader.py  # Git operations
└── scratch/                 # Test scripts
```

## Installation

### Prerequisites

- **Node.js** 18+ (for CLI)
- **Python** 3.10+ (for server)
- **AI Provider** — Ollama, OpenAI API key, or any OpenAI-compatible endpoint

### Install CLI

```bash
npm install -g docforge
```

Or use without installation:

```bash
npx docforge <command>
```

### Install Server Dependencies

```bash
cd server
pip install -r requirements.txt
```

### Setup AI Provider

**Ollama (self-hosted, recommended):**

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3
```

**OpenAI (cloud):**

```bash
export OPENAI_API_KEY="your-api-key"
export AI_BASE_URL="https://api.openai.com/v1"
export AI_MODEL="gpt-4"
```

## Quick Start

### 1. Initialize a Project

```bash
cd your-project
docforge init
```

This creates `.docforge/config.json` and `docs/` directory.

### 2. Set Server URL

```bash
# For local server
docforge set-server http://localhost:8000

# For hosted service
docforge set-server https://your-docforge-server.com
```

### 3. Generate Documentation

**Interactive mode:**

```bash
docforge generate
```

**Command-line mode:**

```bash
# Generate all docs
docforge generate --readme --api --architecture --changelog

# Custom output directory
docforge generate -o ./documentation

# Include specific file patterns
docforge generate --include "**/*.py" "**/*.js"
```

### 4. Generate from Git Repository

```bash
curl -X POST http://localhost:8000/generate-from-repo \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/user/repo.git",
    "branch": "main",
    "options": {
      "include_readme": true,
      "include_api": true
    }
  }'
```

## Usage

### CLI Commands

| Command | Description |
|---------|-------------|
| `docforge generate [path]` | Generate documentation for a project |
| `docforge init` | Initialize DocForge in current directory |
| `docforge serve` | Start the DocForge server locally |
| `docforge set-server <url>` | Set the server URL |
| `docforge get-server` | Show current server URL |

### Generate Options

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --output <dir>` | Output directory | `./docs` |
| `-s, --server <url>` | Server URL override | Configured URL |
| `-i, --include <patterns>` | File patterns to include | Code files |
| `-e, --exclude <patterns>` | File patterns to exclude | node_modules, etc. |
| `--readme` | Generate README.md | `true` |
| `--api` | Generate API.md | `true` |
| `--architecture` | Generate ARCHITECTURE.md | `false` |
| `--changelog` | Generate CHANGELOG.md | `false` |

### Server Options

| Flag | Description | Default |
|------|-------------|---------|
| `-p, --port <port>` | Server port | `8000` |
| `--ai-url <url>` | AI provider base URL | `http://localhost:11434/v1` |
| `--ai-model <model>` | AI model name | `llama3` |
| `--ai-key <key>` | AI provider API key | (none) |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_BASE_URL` | AI provider URL | `http://localhost:11434/v1` |
| `AI_MODEL` | AI model name | `llama3` |
| `AI_API_KEY` | AI provider API key | (none) |
| `AI_TIMEOUT` | Request timeout (seconds) | `300` |
| `MAX_TOKENS` | Max tokens per request | `4000` |
| `TEMPERATURE` | AI temperature | `0.7` |
| `RATE_LIMIT_PER_MINUTE` | Rate limit | `10` |
| `MAX_FILES` | Max files per request | `100` |
| `MAX_FILE_SIZE` | Max file size (bytes) | `500000` |
| `CORS_ORIGINS` | CORS allowed origins | `*` |
| `LOG_LEVEL` | Logging level | `INFO` |

## API Reference

### Endpoints

#### `POST /generate`

Generate documentation from source code files.

**Request:**

```json
{
  "project_name": "my-project",
  "files": [
    {
      "path": "src/main.py",
      "content": "print('hello')",
      "language": "python"
    }
  ],
  "options": {
    "include_readme": true,
    "include_api": true,
    "include_architecture": false,
    "include_changelog": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "docs": {
    "README.md": "# My Project\n\n...",
    "API.md": "## Functions\n\n..."
  },
  "metadata": {
    "files_processed": 5,
    "tokens_used": 1500,
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### `POST /generate-from-repo`

Clone a repository and generate documentation.

**Request:**

```json
{
  "repo_url": "https://github.com/user/repo.git",
  "branch": "main",
  "include_patterns": ["*.py", "*.js"],
  "exclude_patterns": ["node_modules/**", "**/test/**"],
  "options": {
    "include_readme": true,
    "include_api": true
  }
}
```

#### `GET /health`

Health check with AI provider status.

**Response:**

```json
{
  "status": "healthy",
  "service": "docforge-server",
  "timestamp": "2024-01-15T10:30:00Z",
  "ai_provider": {
    "status": "connected",
    "base_url": "http://localhost:11434/v1",
    "model": "llama3"
  }
}
```

## Supported Languages

DocForge automatically detects and processes the following languages:

- JavaScript / TypeScript (.js, .jsx, .mjs, .cjs, .ts, .tsx)
- Python (.py, .pyw)
- Go (.go)
- Java (.java)
- Ruby (.rb)
- PHP (.php)
- C / C++ (.c, .cpp, .h, .hpp)
- C# (.cs)
- Swift (.swift)
- Kotlin (.kt)
- Rust (.rs)
- Scala (.scala)
- R (.r)
- Lua (.lua)
- Perl (.pl)
- Bash / Shell (.sh, .bash, .zsh)

## Configuration

### Client Configuration

Stored in `~/.docforge/config.json`:

```json
{
  "serverUrl": "http://localhost:8000"
}
```

### Project Configuration

Created by `docforge init` in `.docforge/config.json`:

```json
{
  "version": "0.1.0",
  "project": "my-project",
  "created": "2024-01-15T10:00:00Z"
}
```

### Server Configuration

Create a `.env` file in the server directory:

```env
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama3
AI_API_KEY=
AI_TIMEOUT=300
MAX_TOKENS=4000
TEMPERATURE=0.7
RATE_LIMIT_PER_MINUTE=10
MAX_FILES=100
MAX_FILE_SIZE=500000
CORS_ORIGINS=*
LOG_LEVEL=INFO
```

## Development

### Running Tests

```bash
cd scratch
python -m pytest test_backend.py -v
```

### Starting the Server

```bash
cd server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### CLI Development

```bash
cd client
npm install
npm link  # Link for local development
```

## Security

- **Path Traversal Prevention** — File paths are validated and cannot escape the project directory
- **Input Validation** — All requests are validated using Pydantic schemas
- **Request Size Limits** — Maximum file size and file count limits are enforced
- **Rate Limiting** — IP-based rate limiting prevents API abuse
- **CORS Configuration** — Configurable cross-origin request handling

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.