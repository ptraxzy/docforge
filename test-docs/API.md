# DocForge API Documentation

DocForge is an AI-powered documentation generator consisting of a CLI client and a REST API server. This document covers both the client-side CLI commands and the server-side API endpoints.

---

## Table of Contents

1. [CLI Commands](#cli-commands)
2. [REST API Endpoints](#rest-api-endpoints)
3. [Configuration](#configuration)
4. [Data Models](#data-models)
5. [Services](#services)

---

## CLI Commands

The DocForge CLI is built with Commander.js and provides the following commands.

### Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `-V, --version` | Output the version number | - |
| `-h, --help` | Output usage information | - |

---

### `docforge set-server <url>`

Set the DocForge server URL for future commands.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The server URL to set |

**Example:**

```bash
docforge set-server https://docforge.example.com
```

---

### `docforge get-server`

Display the currently configured server URL.

**Example:**

```bash
docforge get-server
# Output: Server URL: https://docforge.example.com
```

---

### `docforge generate [path>`

Generate documentation for a project.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | No | Project directory path (defaults to current directory) |

**Options:**

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `-o, --output <dir>` | output | string | `./docs` | Output directory for generated docs |
| `-s, --server <url>` | server | string | - | Server URL override |
| `-i, --include <patterns...>` | include | string[] | - | File patterns to include |
| `-e, --exclude <patterns...>` | exclude | string[] | - | File patterns to exclude |
| `--readme` | - | boolean | `true` | Generate README.md |
| `--no-readme` | - | boolean | - | Do not generate README.md |
| `--api` | - | boolean | `true` | Generate API.md |
| `--no-api` | - | boolean | - | Do not generate API.md |
| `--architecture` | - | boolean | `false` | Generate ARCHITECTURE.md |
| `--no-architecture` | - | boolean | - | Do not generate ARCHITECTURE.md |
| `--changelog` | - | boolean | `false` | Generate CHANGELOG.md |
| `--no-changelog` | - | boolean | - | Do not generate CHANGELOG.md |

**Example:**

```bash
# Interactive mode
docforge generate

# Non-interactive with options
docforge generate ./my-project -o ./documentation --readme --api

# With specific patterns
docforge generate -i "**/*.js" "**/*.ts" -e "**/node_modules/**" "**/*.test.js"
```

---

### `docforge init`

Initialize DocForge in the current project directory. Creates:
- `.docforge/config.json` - Configuration file
- `docs/README.md` - Placeholder README

**Example:**

```bash
docforge init
```

---

### `docforge serve`

Start the DocForge server locally.

**Options:**

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `-p, --port <port>` | port | string | `8000` | Port to listen on |
| `--ai-url <url>` | aiUrl | string | `http://localhost:11434/v1` | AI provider base URL (OpenAI-compatible) |
| `--ai-model <model>` | aiModel | string | `llama3` | AI model name |
| `--ai-key <key>` | aiKey | string | - | AI provider API key (optional for self-hosted) |

**Example:**

```bash
docforge serve -p 8080 --ai-url http://localhost:11434/v1 --ai-model llama3
```

---

## REST API Endpoints

The DocForge server exposes a FastAPI-based REST API.

**Base URL:** `http://{host}:{port}`

**Default:** `http://0.0.0.0:8000`

---

### `GET /health`

Health check endpoint with AI provider status.

**Response:**

```json
{
  "status": "healthy",
  "service": "docforge-server",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ai_provider": {
    "status": "connected",
    "base_url": "http://localhost:11434/v1",
    "model": "llama3"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Overall health status (`healthy`, `unhealthy`) |
| `service` | string | Service identifier |
| `timestamp` | string | ISO 8601 timestamp |
| `ai_provider` | object | AI provider connection status |
| `ai_provider.status` | string | AI provider status (`connected`, `disconnected`) |
| `ai_provider.base_url` | string | AI provider base URL |
| `ai_provider.model` | string | AI model name |

---

### `POST /generate`

Generate documentation from source code files.

**Request Body:**

```json
{
  "project_name": "my-project",
  "files": [
    {
      "path": "src/index.js",
      "content": "const app = express();",
      "language": "javascript"
    }
  ],
  "git_context": {
    "recent_commits": ["feat: add endpoint", "fix: bug"],
    "branch": "main"
  },
  "options": {
    "include_readme": true,
    "include_api": true,
    "include_architecture": false,
    "include_changelog": false
  }
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project_name` | string | Yes | Project name (max 200 characters) |
| `files` | array[FileInput] | Yes | Source code files (minimum 1, maximum 100) |
| `git_context` | GitContext | No | Git repository context |
| `options` | GenerateOptions | No | Documentation generation options |

**Response (200 OK):**

```json
{
  "success": true,
  "docs": {
    "README.md": "# My Project\n\nOverview...",
    "API.md": "## Functions\n\n..."
  },
  "metadata": {
    "files_processed": 5,
    "tokens_used": 1500,
    "generated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether generation succeeded |
| `docs` | object | Generated documentation files (filename -> content mapping) |
| `metadata` | object | Generation metadata |
| `metadata.files_processed` | integer | Number of files processed |
| `metadata.tokens_used` | integer | Total tokens consumed |
| `metadata.generated_at` | string | ISO 8601 timestamp |

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Invalid request (validation error, path traversal attempt) |
| 429 | Rate limit exceeded |
| 500 | Server error during generation |

---

### `POST /generate-from-repo`

Download a git repository and generate documentation from its code.

**Request Body:**

```json
{
  "repo_url": "https://github.com/user/repo.git",
  "branch": "main",
  "include_patterns": ["*.js", "*.ts", "*.py"],
  "exclude_patterns": ["node_modules/**", "**/*.test.js"],
  "options": {
    "include_readme": true,
    "include_api": true,
    "include_architecture": false,
    "include_changelog": false
  }
}
```

**Request Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `repo_url` | string | Yes | - | Git repository URL (must start with `https://`, `http://`, or `git@`) |
| `branch` | string | No | `main` | Branch to clone |
| `include_patterns` | string[] | No | See below | File patterns to include |
| `exclude_patterns` | string[] | No | See below | File patterns to exclude |
| `options` | GenerateOptions | No | - | Documentation generation options |

**Default `include_patterns`:**
```
["*.js", "*.ts", "*.py", "*.go", "*.java"]
```

**Default `exclude_patterns`:**
```
["node_modules/**", "*.test.js", "__pycache__/**", "*.test.ts"]
```

**Response:** Same as `POST /generate`

---

## Configuration

### CLI Configuration

Stored in `~/.docforge/config.json`.

```json
{
  "serverUrl": "https://docforge.example.com"
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `serverUrl` | string | `https://docforge-ptraxzy.loca.lt` | Default server URL |

### Server Configuration

Can be set via environment variables or `.env` file.

| Environment Variable | Type | Default | Description |
|---------------------|------|---------|-------------|
| `HOST` | string | `0.0.0.0` | Server host |
| `PORT` | integer | `8000` | Server port |
| `AI_BASE_URL` | string | `http://localhost:11434/v1` | OpenAI-compatible API endpoint |
| `AI_API_KEY` | string | `""` | API key (optional for self-hosted) |
| `AI_MODEL` | string | `llama3` | AI model name |
| `AI_TIMEOUT` | float | `300.0` | AI request timeout in seconds |
| `MAX_TOKENS` | integer | `4000` | Maximum tokens for generation |
| `TEMPERATURE` | float | `0.7` | AI generation temperature |
| `RATE_LIMIT_PER_MINUTE` | integer | `10` | Rate limit for generation requests |
| `MAX_FILE_SIZE` | integer | `500000` | Maximum file size in bytes (500KB) |
| `MAX_FILES` | integer | `100` | Maximum files per request |
| `CORS_ORIGINS` | string | `*` | CORS allowed origins (comma-separated) |
| `LOG_LEVEL` | string | `INFO` | Logging level |

### Supported Languages

```python
{
  "javascript": "javascript", "js": "javascript",
  "typescript": "typescript", "ts": "typescript",
  "python": "python", "py": "python",
  "go": "go", "golang": "go",
  "rust": "rust", "java": "java",
  "php": "php", "ruby": "ruby",
  "c": "c", "cpp": "cpp", "c++": "cpp",
  "csharp": "csharp", "c#": "csharp",
  "kotlin": "kotlin", "swift": "swift"
}
```

---

## Data Models

### FileInput

Represents a source code file for documentation generation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | File path relative to project root |
| `content` | string | Yes | File content |
| `language` | string | Yes | Programming language |

**Validation:**
- `path` must be relative and cannot contain `..` or start with `/`
- `content` must not exceed `MAX_FILE_SIZE` (500KB default)

---

### GitContext

Git repository context for enhanced documentation.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `recent_commits` | string[] | No | `[]` | Recent commit messages |
| `branch` | string | No | `main` | Current branch name |

---

### GenerateOptions

Documentation generation options.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `include_readme` | boolean | `true` | Generate README.md |
| `include_api` | boolean | `true` | Generate API.md |
| `include_architecture` | boolean | `false` | Generate ARCHITECTURE.md |
| `include_changelog` | boolean | `false` | Generate CHANGELOG.md |

---

### GenerateRequest

Complete request model for documentation generation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project_name` | string | Yes | Project name (max 200 chars) |
| `files` | FileInput[] | Yes | Source files (1-100 files) |
| `git_context` | GitContext | No | Git context |
| `options` | GenerateOptions | No | Generation options |

**Validation:**
- Minimum 1 file required
- Maximum 100 files per request

---

### RepoDownloadRequest

Request model for repository-based documentation.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `repo_url` | string | Yes | - | Git repository URL |
| `branch` | string | No | `main` | Branch to clone |
| `include_patterns` | string[] | No | See configuration | Patterns to include |
| `exclude_patterns` | string[] | No | See configuration | Patterns to exclude |
| `options` | GenerateOptions | No | - | Generation options |

**Validation:**
- `repo_url` must start with `https://`, `http://`, or `git@`

---

### GenerateResponse

Response model for documentation generation.

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether generation succeeded |
| `docs` | dict | Generated documents (filename -> content) |
| `metadata` | GenerateMetadata | Generation metadata |

---

### GenerateMetadata

Metadata about the generation process.

| Field | Type | Description |
|-------|------|-------------|
| `files_processed` | integer | Number of files processed |
| `tokens_used` | integer | Total AI tokens consumed |
| `generated_at` | datetime | ISO 8601 timestamp |

---

## Services

### Client Services

#### `config.js`

**`getConfig()`**

Retrieve the current configuration.

```javascript
import { getConfig } from './utils/config.js';

const config = getConfig();
// Returns: { serverUrl: "https://..." }
```

**`saveConfig(config)`**

Save configuration to disk.

```javascript
import { saveConfig } from './utils/config.js';

saveConfig({ serverUrl: "https://example.com" });
```

**`getServerUrl()`**

Get the configured server URL.

```javascript
import { getServerUrl } from './utils/config.js';

const url = getServerUrl();
```

**`setServerUrl(url)`**

Set and persist the server URL.

```javascript
import { setServerUrl } from './utils/config.js';

setServerUrl("https://docforge.example.com");
```

---

#### `fileScanner.js`

**`scanCodeFiles(dirPath, includePatterns, excludePatterns)`**

Scan a directory for code files matching patterns.

```javascript
import { scanCodeFiles } from './utils/fileScanner.js';

const files = await scanCodeFiles('./my-project', null, null);
// Returns: [{ path: "src/index.js", content: "...", language: "javascript" }]
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `dirPath` | string | Yes | - | Directory to scan |
| `includePatterns` | string[] | No | Default patterns | Glob patterns to include |
| `excludePatterns` | string[] | No | Default exclusions | Glob patterns to exclude |

**Returns:** `Promise<Array<{path: string, content: string, language: string}>>`

---

**`getProjectName(dirPath)`**

Extract project name from directory path.

```javascript
import { getProjectName } from './utils/fileScanner.js';

const name = getProjectName('./my-awesome-project');
// Returns: "my-awesome-project"
```

---

### Server Services

#### `AIProvider`

OpenAI-compatible AI provider wrapper.

**`__init__()`**

Initialize the AI provider.

```python
from services.ai_provider import AIProvider

provider = AIProvider()
```

**`generate(prompt, system_prompt=None, model=None, max_tokens=None)`**

Generate text using the AI provider.

```python
provider = AIProvider()
text, tokens = await provider.generate(
    prompt="Explain this code",
    system_prompt="You are a helpful assistant",
    model="llama3",
    max_tokens=1000
)
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | User prompt |
| `system_prompt` | string | No | None | System prompt |
| `model` | string | No | Config default | Override model |
| `max_tokens` | int | No | Config default | Max tokens |

**Returns:** `tuple[str, int]` - (generated_text, tokens_used)

**Raises:**
- `ConnectionError` - Cannot connect to AI provider
- `TimeoutError` - Request timed out
- `httpx.HTTPStatusError` - API returned error

---

**`check_health()`**

Check AI provider connectivity.

```python
provider = AIProvider()
status = await provider.check_health()
# Returns: {"status": "connected", "base_url": "...", "model": "..."}
```

**Returns:** `dict` with connection status

---

**`get_ai_provider()`**

Get singleton AI provider instance.

```python
from services.ai_provider import get_ai_provider

provider = get_ai_provider()
```

---

#### `doc_generator.py`

**`build_prompt(request)`**

Build the AI prompt from a GenerateRequest.

```python
from services.doc_generator import build_prompt
from models.schemas import GenerateRequest

prompt = build_prompt(request)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `request` | GenerateRequest | Yes | Generation request |

**Returns:** `str` - Formatted prompt for AI

---

**`parse_ai_response(response_text)`**

Parse AI response into structured documentation.

```python
from services.doc_generator import parse_ai_response

docs = parse_ai_response(ai_response_text)
// Returns: {"README.md": "# Project\n...", "API.md": "..."}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `response_text` | string | Yes | Raw AI response |

**Returns:** `dict[str, str]` - Filename to content mapping

---

**`generate_docs_from_code(request)`**

Generate documentation from code files.

```python
from services.doc_generator import generate_docs_from_code
from models.schemas import GenerateRequest

docs, tokens = await generate_docs_from_code(request)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `request` | GenerateRequest | Yes | Generation request |

**Returns:** `tuple[dict[str, str], int]` - (docs, tokens_used)

---

#### `repo_downloader.py`

**`clone_repo(repo_url, branch="main", dest_dir=None)`**

Clone a git repository to a temporary directory.

```python
from services.repo_downloader import clone_repo

path = clone_repo("https://github.com/user/repo.git", "main")
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `repo_url` | string | Yes | - | Repository URL |
| `branch` | string | No | `"main"` | Branch to clone |
| `dest_dir` | string | No | Temp directory | Destination path |

**Returns:** `str` - Path to cloned repository

**Raises:** `ValueError` - If cloning fails

---

**`get_files_from_repo(repo_path, include_patterns=None, exclude_patterns=None)`**

Get all files from a repository matching patterns.

```python
from services.repo_downloader import get_files_from_repo

files = get_files_from_repo(
    "/tmp/docforge_abc123",
    include_patterns=["*.js", "*.py"],
    exclude_patterns=["node_modules/**"]
)
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `repo_path` | string | Yes | - | Repository path |
| `include_patterns` | list[str] | No | Default patterns | Include glob patterns |
| `exclude_patterns` | list[str] | No | Default exclusions | Exclude glob patterns |

**Returns:** `list[dict]` - List of `{path, content, language}` dicts

---

**`get_git_context(repo_path)`**

Extract git context from a repository.

```python
from services.repo_downloader import get_git_context

context = get_git_context("/path/to/repo")
// Returns: {"recent_commits": [...], "branch": "main"}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo_path` | string | Yes | Repository path |

**Returns:** `dict` - Git context with commits and branch

---

**`cleanup_repo(repo_path)`**

Remove a cloned repository directory.

```python
from services.repo_downloader import cleanup_repo

cleanup_repo("/tmp/docforge_abc123")
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo_path` | string | Yes | Repository path to remove |

---

## Rate Limiting

The server implements IP-based rate limiting for generation endpoints.

- **Limit:** `RATE_LIMIT_PER_MINUTE` requests per minute (default: 10)
- **Scope:** Applies to `/generate` and `/generate-from-repo` endpoints

**Response when limit exceeded (429):**

```json
{
  "success": false,
  "error": "Too Many Requests",
  "detail": "Rate limit exceeded. Maximum 10 requests per minute."
}
```

---

## Error Handling

### Client Errors (4xx)

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Bad Request | Invalid input, path traversal, validation failure |
| 422 | Unprocessable Entity | Schema validation failure |
| 429 | Too Many Requests | Rate limit exceeded |

### Server Errors (5xx)

| Status | Error | Cause |
|--------|-------|-------|
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | AI provider error |
| 503 | Service Unavailable | AI provider unreachable |

---

## Security Considerations

1. **Path Traversal Prevention:** File paths cannot contain `..` or start with `/`
2. **File Size Limits:** Individual files limited to 500KB
3. **File Count Limits:** Maximum 100 files per request
4. **Rate Limiting:** Prevents abuse of AI generation
5. **CORS:** Configurable allowed origins

---

## Examples

### CLI Example

```bash
# Initialize project
docforge init

# Generate docs interactively
docforge generate

# Generate specific docs
docforge generate . --readme --api -o ./documentation
```

### API Example (cURL)

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "my-project",
    "files": [
      {
        "path": "src/main.py",
        "content": "print(\"hello\")",
        "language": "python"
      }
    ],
    "options": {
      "include_readme": true,
      "include_api": true
    }
  }'
```

### Python Client Example

```python
import httpx
import asyncio

async def generate_docs():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/generate",
            json={
                "project_name": "my-project",
                "files": [
                    {"path": "main.py", "content": "code...", "language": "python"}
                ],
                "options": {"include_readme": True, "include_api": True}
            },
            timeout=300.0
        )
        data = response.json()
        print(data["docs"])

asyncio.run(generate_docs())
```