# DocForge

**AI-Powered Documentation Generator - Open Source**

DocForge is a comprehensive documentation generation tool that uses AI to automatically create comprehensive documentation from source code. It consists of two components: a Python/FastAPI server that handles AI-powered doc generation, and a Node.js CLI client for easy project integration.

## Features

### Core Features
- **Multi-language support**: JavaScript, TypeScript, Python, Go, Rust, Java, PHP, Ruby, C/C++, C#, Kotlin, Swift, and more
- **Flexible AI integration**: Works with any OpenAI-compatible API endpoint (Ollama, vLLM, LM Studio, OpenAI, OpenRouter, Groq)
- **Repository support**: Clone and document Git repositories directly
- **Framework detection**: Automatically detects Laravel, React (Next.js/Vite), and static projects
- **Offline generation**: Generate basic documentation without AI (README, API reference)

### CLI Client Features
- **Interactive mode**: Step-by-step guided documentation generation
- **Command-line mode**: Full control via flags for automation and CI/CD
- **Diff viewer**: Review changes before saving
- **Local server**: Self-host the DocForge server with local AI
- **Automatic updates**: Checks for new versions on startup

### Documentation Outputs
- **README.md**: Project overview, setup instructions, and features
- **API.md**: Reference documentation for endpoints, classes, and functions
- **ARCHITECTURE.md**: High-level architectural design (for larger projects)
- **CHANGELOG.md**: Version history tracking

### Documentation Website Builder
- Build premium documentation websites from markdown files
- Framework-specific templates (React component, Laravel Blade)
- Search functionality with fuzzy matching
- Dark mode support
- Syntax highlighting with Prism.js
- Table of contents navigation

## Quick Start

### Using the CLI Client

```bash
# Install globally via npm
npm install -g @ultramaxoo/docforge

# Or run with npx
npx docforge --version
```

### CLI Commands

#### Initialize a Project
```bash
docforge init
```
Creates `.docforge/config.json` and `docs/README.md` with placeholder content.

#### Generate Documentation
```bash
# Interactive mode (guided prompts)
docforge generate

# Non-interactive mode with flags
docforge generate ./path/to/project \
  --output ./docs \
  --readme \
  --api \
  --architecture
```

**Generate Options:**
- `--output, -o <dir>` - Output directory (default: `./`)
- `--server, -s <url>` - Server URL override
- `--include <patterns...>` - File patterns to include
- `--exclude <patterns...>` - File patterns to exclude
- `--readme/--no-readme` - Generate README.md (default: true)
- `--api/--no-api` - Generate API.md (default: true)
- `--architecture/--no-architecture` - Generate ARCHITECTURE.md (default: false)
- `--changelog/--no-changelog` - Generate CHANGELOG.md (default: false)

#### Build Documentation Website
```bash
docforge build-site \
  --input ./docs \
  --output ./docs-site
```

#### Start Local Server
```bash
docforge serve \
  --port 8000 \
  --ai-url http://localhost:11434/v1 \
  --ai-model llama3
```

#### Configure Server URL
```bash
# Set server URL
docforge set-server http://ip.lobu.biz.id:45557

# View current server
docforge get-server
```

### Using the Python Server

#### Prerequisites

- Python 3.10+
- An AI provider (Ollama, OpenAI, OpenRouter, etc.)

#### Installation

```bash
# Clone the repository
git clone <repo-url>
cd server

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

#### Configuration

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

#### Running the Server

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

## API Reference

### CLI Client Endpoints

The CLI communicates with the server via REST API:

| Command | Description |
|---------|-------------|
| `docforge generate` | Generate docs from local source files |
| `docforge build-site` | Build documentation website |
| `docforge init` | Initialize project with DocForge |
| `docforge serve` | Start local server instance |
| `docforge set-server` | Configure server URL |
| `docforge get-server` | Display current server URL |

### Server API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate` | POST | Generate docs from source code |
| `/generate-from-repo` | POST | Clone repo and generate docs |
| `/health` | GET | Health check with AI status |

### Example API Usage

#### Generate Documentation from Files

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

#### Generate Documentation from Repository

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

## Project Structure

```
docforge/
├── client/                  # Node.js CLI client
│   ├── src/
│   │   ├── index.js        # CLI entry point
│   │   ├── commands/
│   │   │   ├── generate.js # Documentation generation
│   │   │   ├── buildSite.js# Website builder
│   │   │   ├── init.js     # Project initialization
│   │   │   └── serve.js    # Local server startup
│   │   ├── utils/
│   │   │   ├── compiler.js # Markdown to HTML compiler
│   │   │   ├── config.js   # Configuration management
│   │   │   ├── detector.js # Framework detection
│   │   │   ├── diffViewer.js# Diff preview before save
│   │   │   ├── fileScanner.js# Source code scanning
│   │   │   ├── offlineGenerator.js# Offline doc generation
│   │   │   └── updateChecker.js# Version update checker
│   │   └── templates/
│   │       ├── react-component.tsx # React documentation template
│   │       └── laravel.blade.php   # Laravel documentation template
└── server/                  # Python/FastAPI server
    ├── main.py             # Server entry point
    └── ...
```

## Configuration

### CLI Configuration

The CLI stores configuration in `~/.docforge/config.json`:

```json
{
  "serverUrl": "http://ip.lubu.biz.id:45557"
}
```

### Project Configuration

Each project can have a `.docforge/config.json`:

```json
{
  "version": "0.1.0",
  "project": "my-project",
  "created": "2024-01-01T00:00:00.000Z"
}
```

## Framework Detection

DocForge automatically detects the following frameworks:

| Framework | Detection Method |
|-----------|------------------|
| Laravel | Presence of `artisan` file or `laravel/framework` in composer.json |
| Next.js | `next` dependency in package.json |
| React (Vite) | `react` dependency in package.json |
| Static | Default fallback |

## Supported Languages

The file scanner supports the following languages:

- JavaScript / TypeScript (.js, .jsx, .mjs, .ts, .tsx)
- Python (.py, .pyw)
- Go (.go)
- Java (.java)
- Ruby (.rb)
- PHP (.php)
- C/C++ (.c, .cpp, .h, .hpp)
- C# (.cs)
- Swift (.swift)
- Kotlin (.kt)
- Rust (.rs)
- Scala (.scala)
- R (.r)
- Lua (.lua)
- Perl (.pl)
- Bash (.sh, .bash, .zsh)

## Contributing

Contributions are welcome. Please ensure:

1. All new features include appropriate tests
2. Code follows existing style conventions
3. Documentation is updated accordingly

## License

MIT License