# DocForge CLI

AI-powered documentation generator - open source CLI client.

## Quick Start

### Connect to a server (recommended)

```bash
# Install globally
npm install -g docforge

# Or use with npx
npx docforge generate

# Set your DocForge server URL
docforge set-server http://your-server:8000

# Generate docs for current project
docforge generate
```

### Run server locally

```bash
# Clone the full repo
git clone https://github.com/yourname/docforge

# Start AI server (Ollama)
ollama serve && ollama pull llama3

# Start DocForge server
cd docforge/server
cp .env.example .env
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# In another terminal, use the CLI
cd client
npm install
docforge generate
```

## Commands

### `docforge generate [path]`

Generate documentation for a project.

```bash
# Generate docs in current directory
docforge generate

# Generate docs for specific path
docforge generate ./my-project

# Custom output directory
docforge generate -o ./my-docs

# Include only specific patterns
docforge generate -i "*.js" "*.ts"

# Exclude patterns
docforge generate -e "node_modules/**" "*.test.js"

# Use specific server
docforge generate -s http://localhost:8000

# Control which docs to generate
docforge generate --architecture --changelog
docforge generate --no-api
```

### `docforge init`

Initialize DocForge in current project.

```bash
docforge init
```

### `docforge set-server <url>`

Set the DocForge server URL.

```bash
docforge set-server http://localhost:8000
docforge set-server https://docforge.yourserver.com
```

### `docforge get-server`

Show current server URL.

```bash
docforge get-server
```

### `docforge serve`

Start a local DocForge server (requires full repo).

```bash
docforge serve
docforge serve --port 9000
docforge serve --ai-url http://localhost:11434/v1 --ai-model llama3
docforge serve --ai-url https://api.openai.com/v1 --ai-key sk-your-key --ai-model gpt-4o-mini
```

## Configuration

Server URL is stored in `~/.docforge/config.json`.

```json
{
  "serverUrl": "http://localhost:8000"
}
```

Project-specific options can be configured in `.docforge/config.json`:

```json
{
  "version": "0.1.0",
  "project": "my-project",
  "options": {
    "include_readme": true,
    "include_api": true,
    "include_architecture": true,
    "include_changelog": false
  }
}
```

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                 DEVELOPER MACHINE                    │
│                                                     │
│   docforge generate ./my-project                    │
│              │                                      │
└──────────────┼──────────────────────────────────────┘
               │ HTTP
               ▼
┌─────────────────────────────────────────────────────┐
│               DOCFORGE SERVER                        │
│                                                     │
│   1. Receives code files                            │
│   2. Sends to AI (your provider)                    │
│   3. Returns generated markdown docs                 │
└─────────────────────────────────────────────────────┘
```

## License

MIT
