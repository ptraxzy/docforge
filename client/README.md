# DocForge CLI Client

**AI-Powered Documentation & Site Generator — CLI Client**

The DocForge CLI client is a lightweight command-line utility that scans your project source code, detects your framework, and generates clean markdown documentation files or compiles them into a premium responsive documentation site.

---

## Installation

### Option 1: Global Installation (Recommended)

Install globally on your system to run `docforge` directly from any directory:

```bash
npm install -g @ultramaxoo/docforge
```

### Option 2: Run with NPX

Run instantly without global installation:

```bash
npx @ultramaxoo/docforge generate
npx @ultramaxoo/docforge build-site
```

---

## Commands Reference

### 1. `docforge init`
Initializes a new DocForge config file at `.docforge/config.json` inside your project root and creates a default `docs/` workspace.

```bash
docforge init
```

### 2. `docforge generate [path]`
Scans the target directory files, detects language features, and contacts the DocForge server to generate markdown files.

```bash
# Guided interactive generation
docforge generate

# Fast run on specific path
docforge generate ./src

# Exclude test files and include specific file types
docforge generate -i "*.js" "*.ts" -e "**/*.test.js" "node_modules/**"

# Only generate README.md and API.md
docforge generate --readme --api --no-architecture --no-changelog
```

#### CLI Options:
* `-o, --output <dir>`: Target folder for generated docs (default: `./`)
* `-s, --server <url>`: Override the default backend server endpoint
* `-i, --include <patterns...>`: Glob patterns to include
* `-e, --exclude <patterns...>`: Glob patterns to exclude
* `--readme` / `--no-readme`: Generate/Skip `README.md` (default: true)
* `--api` / `--no-api`: Generate/Skip `API.md` (default: true)
* `--architecture` / `--no-architecture`: Generate/Skip `ARCHITECTURE.md` (default: false)
* `--changelog` / `--no-changelog`: Generate/Skip `CHANGELOG.md` (default: false)

---

### 3. `docforge build-site`
Scans your local directories, auto-detects your frontend framework (React Next.js, Vite/React, Laravel, or Static HTML), and builds a premium documentation site.

```bash
# Build the site from docs folder into output directory
docforge build-site --input ./docs --output ./docs-site

# Compile directly from existing markdown docs without calling the AI
docforge build-site --compile-only
```

#### CLI Options:
* `-i, --input <dir>`: Directory containing markdown files (default: `./docs`)
* `-o, --output <dir>`: Target directory for static HTML builds (default: `./docs-site`)
* `--compile-only`: Skips any server checks/generation and compiles local documents instantly

---

### 4. `docforge set-server <url>` & `docforge get-server`
Configure the DocForge CLI client to point to a specific API backend instance (e.g. your local self-hosted server or a custom corporate API gateway).

```bash
# Set server API endpoint
docforge set-server http://localhost:8000

# View current server API endpoint
docforge get-server
```

---

### 5. `docforge serve`
Starts a local self-hosted instance of the DocForge backend server directly from the CLI.

```bash
docforge serve --port 8000 --ai-url http://localhost:11434/v1 --ai-model llama3
```

---

## Configuration Files

### 1. Global Config (`~/.docforge/config.json`)
Stores global CLI settings:

```json
{
  "serverUrl": "http://localhost:8000"
}
```

### 2. Project Config (`.docforge/config.json`)
Configure project-specific scopes and options:

```json
{
  "version": "0.1.0",
  "project": "my-awesome-app",
  "options": {
    "include_readme": true,
    "include_api": true,
    "include_architecture": true,
    "include_changelog": false
  }
}
```

---

## License

MIT
