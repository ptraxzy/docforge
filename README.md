# DocForge

**AI-Powered Documentation Generator — Open Source & Self-Hostable**

DocForge is a production-ready documentation generation tool that uses AI to automatically scan your codebase and create high-quality documentation. It features a Node.js CLI client with a premium static website builder and a FastAPI backend server compatible with any OpenAI-compatible LLM.

---

## Key Features

- 🌐 **Multi-Language Support**: Scans and documents JavaScript, TypeScript, Python, Go, Rust, Java, PHP, C++, C#, Kotlin, Swift, and more.
- 🤖 **Bring Your Own AI**: Seamlessly connect to Ollama, vLLM, LM Studio, OpenAI, OpenRouter, or Groq.
- ⚡ **Framework Detection & Integration**: Automatically detects Laravel, Next.js, Vite/React, or Static projects and injects custom-tailored documentation pages (`Docs.tsx`, `docs.blade.php`, or static `index.html`) directly.
- 📂 **Website Builder**: Builds a premium documentation site from Markdown files featuring:
  - **Nested Sidebar Tree Navigation** with custom guide lines.
  - **Active State Highlights** synced across scrolling, manual clicks, and Next/Previous navigation buttons.
  - **Clean Expanded Layout** with full responsiveness and copy-to-clipboard buttons on code snippets.
- 🚀 **Docker Ready**: Easy self-hosting with preconfigured `docker-compose.yml`.

---

## Quick Start

### Option 1: Run instantly with npx (No Setup Required)

Generate documentation for your project in seconds without installing anything:

```bash
# Generate markdown documentation files
npx @ultramaxoo/docforge generate

# Build a premium documentation site
npx @ultramaxoo/docforge build-site
```

### Option 2: Global Installation

Install globally on your system to use the CLI directly:

```bash
# Install CLI
npm install -g @ultramaxoo/docforge

# Initialize docforge config in your project
docforge init

# Generate docs
docforge generate

# Build docs site
docforge build-site
```

---

## CLI Command Reference

### 1. `docforge init`
Initializes a local configuration file `.docforge/config.json` and a placeholder documentation folder.

### 2. `docforge generate [path]`
Scans the directory files and generates markdown docs.
- `-o, --output <dir>`: Output directory (default: `./`)
- `-s, --server <url>`: Target server URL override
- `-i, --include <patterns...>`: File patterns to include
- `-e, --exclude <patterns...>`: File patterns to exclude
- `--readme` / `--no-readme`: Toggle README.md generation
- `--api` / `--no-api`: Toggle API.md generation
- `--architecture` / `--no-architecture`: Toggle ARCHITECTURE.md generation
- `--changelog` / `--no-changelog`: Toggle CHANGELOG.md generation

### 3. `docforge build-site`
Compiles generated markdown files into a premium docs site matching your local framework.
- `-i, --input <dir>`: Directory containing markdown files (default: `./docs`)
- `-o, --output <dir>`: Output directory for static HTML pages (default: `./docs-site`)
- `--compile-only`: Compile existing markdown files directly without calling the AI

### 4. `docforge serve`
Starts the DocForge server locally for self-hosting.
- `-p, --port <port>`: Port to listen on (default: `8000`)
- `--ai-url <url>`: AI endpoint base URL
- `--ai-model <model>`: AI model name
- `--ai-key <key>`: AI provider API key (optional)

### 5. `docforge set-server <url>` & `docforge get-server`
Sets or displays the default DocForge API backend server URL.

---

## Self-Hosting & Docker Setup

You can run the full server stack locally using Docker Compose:

```bash
# Start server + Ollama AI service
docker compose up -d

# Pull an AI model to your local Ollama instance
docker compose exec ollama ollama pull llama3

# Configure CLI to point to your local server
docforge set-server http://localhost:8000
```

### Server Environment Variables (`.env`)

Configure the FastAPI server by creating a `.env` file under `server/`:

```env
AI_BASE_URL=http://localhost:11434/v1  # OpenAI-compatible API endpoint
AI_MODEL=llama3                        # Model identifier
AI_API_KEY=your-api-key-here           # Optional key for cloud providers
MAX_TOKENS=4000
TEMPERATURE=0.7
HOST=0.0.0.0
PORT=8000
RATE_LIMIT_PER_MINUTE=10
CORS_ORIGINS=*
```

---

## Supported AI Providers

DocForge works out of the box with any OpenAI-compatible API:

| Provider | Base URL | Note |
|---|---|---|
| **Ollama** | `http://localhost:11434/v1` | Free & local |
| **vLLM** | `http://localhost:8000/v1` | High-performance |
| **LM Studio** | `http://localhost:1234/v1` | GUI local runner |
| **OpenAI** | `https://api.openai.com/v1` | Cloud API |
| **OpenRouter** | `https://openrouter.ai/api/v1` | Aggregated services |
| **Groq** | `https://api.groq.com/openai/v1` | Fast inference |

---

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
│   └── requirements.txt
│
├── client/                 # Node.js CLI
│   ├── src/
│   │   ├── index.js        # CLI command registration
│   │   ├── commands/
│   │   │   ├── generate.js  # Doc generation engine
│   │   │   ├── buildSite.js # Site compilation engine
│   │   │   ├── init.js
│   │   │   └── serve.js
│   │   └── templates/
│   │       ├── react-component.tsx # React template (Next.js/Vite)
│   │       ├── laravel.blade.php   # Laravel Blade template
│   │       └── static.html         # Static HTML/Alpine.js template
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## License

MIT
