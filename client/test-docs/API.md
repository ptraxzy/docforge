## API Reference

Base URL: `http://localhost:8000`

---

## Endpoints

### Health Check

**GET** `/health`

Check service health and AI provider status.

**Response**

```json
{
  "status": "healthy",
  "service": "docforge-server",
  "timestamp": "2024-01-01T00:00:00Z",
  "ai_provider": {
    "status": "connected",
    "model": "llama3",
    "latency_ms": 50
  }
}
```

---

### Generate Documentation

**POST** `/generate`

Generate documentation from source code files.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project_name` | string | Yes | Project name (max 200 chars) |
| `files` | array | Yes | List of source files (1-100 files) |
| `git_context` | object | No | Git context information |
| `options` | object | No | Generation options |

**File Object**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | File path relative to project root |
| `content` | string | Yes | File content |
| `language` | string | Yes | Programming language |

**Supported Languages**: `javascript`, `js`, `typescript`, `ts`, `python`, `py`, `go`, `golang`, `rust`, `java`, `php`, `ruby`, `c`, `cpp`, `c++`, `csharp`, `c#`, `kotlin`, `swift`

**GitContext Object**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recent_commits` | array[string] | No | Recent commit messages |
| `branch` | string | No | Current branch name (default: "main") |

**Options Object**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `include_readme` | boolean | true | Generate README.md |
| `include_api` | boolean | true | Generate API.md |
| `include_architecture` | boolean | false | Generate ARCHITECTURE.md |
| `include_changelog` | boolean | false | Generate CHANGELOG.md |

**Example Request**

```json
{
  "project_name": "my-api-server",
  "files": [
    {
      "path": "src/main.py",
      "content": "def main():\n    print('Hello World')",
      "language": "python"
    },
    {
      "path": "src/utils.py",
      "content": "def helper(): pass",
      "language": "python"
    }
  ],
  "git_context": {
    "recent_commits": ["feat: initial commit"],
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

**Response**

```json
{
  "success": true,
  "docs": {
    "README.md": "# My API Server\n\nOverview...",
    "API.md": "## Functions\n\n### main..."
  },
  "metadata": {
    "files_processed": 2,
    "tokens_used": 1500,
    "generated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Invalid request (missing files, invalid language, etc.) |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

### Generate Documentation from Repository

**POST** `/generate-from-repo`

Clone a Git repository and generate documentation from its source code.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repo_url` | string | Yes | Git repository URL (http/https/git@) |
| `branch` | string | No | Branch to clone (default: "main") |
| `include_patterns` | array[string] | No | File patterns to include |
| `exclude_patterns` | array[string] | No | File patterns to exclude |
| `options` | object | No | Generation options |

**Default Include Patterns**

```json
["*.js", "*.ts", "*.py", "*.go", "*.java"]
```

**Default Exclude Patterns**

```json
["node_modules/**", "*.test.js", "__pycache__/**", "*.test.ts"]
```

**Example Request**

```json
{
  "repo_url": "https://github.com/username/repository",
  "branch": "main",
  "include_patterns": ["*.py", "*.js", "*.ts"],
  "exclude_patterns": ["node_modules/**", "**/test/**", "*.min.js"],
  "options": {
    "include_readme": true,
    "include_api": true,
    "include_architecture": true,
    "include_changelog": true
  }
}
```

**Response**

```json
{
  "success": true,
  "docs": {
    "README.md": "# Repository\n\nProject overview...",
    "API.md": "## Endpoints\n\n### GET /api/users...",
    "ARCHITECTURE.md": "## Structure\n\n### Modules...",
    "CHANGELOG.md": "## Changelog\n\n### v1.0.0..."
  },
  "metadata": {
    "files_processed": 45,
    "tokens_used": 3200,
    "generated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses**

| Status | Description |
|--------|-------------|
| 400 | Invalid URL, no files found, or clone failed |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## Configuration Parameters

All configuration is done via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `AI_BASE_URL` | `http://localhost:11434/v1` | AI provider endpoint |
| `AI_API_KEY` | (empty) | API key for AI provider |
| `AI_MODEL` | `llama3` | AI model name |
| `MAX_TOKENS` | `4000` | Maximum tokens per generation |
| `TEMPERATURE` | `0.7` | Generation temperature (0.0-2.0) |
| `RATE_LIMIT_PER_MINUTE` | `10` | Rate limit per IP |
| `MAX_FILE_SIZE` | `500000` | Max file size in bytes (500KB) |
| `MAX_FILES` | `100` | Maximum files per request |
| `CORS_ORIGINS` | `*` | CORS allowed origins |
| `LOG_LEVEL` | `INFO` | Logging level |

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error type",
  "detail": "Detailed error message"
}
```

**Common Error Codes**

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request - Invalid input data |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Generation failed |
| 503 | Service Unavailable - AI provider unreachable |

---

## Rate Limiting

Rate limiting is applied per IP address for generation endpoints:
- `/generate`
- `/generate-from-repo`

Default limit: 10 requests per minute per IP.

When rate limited, the server returns:

```json
{
  "success": false,
  "error": "Too Many Requests",
  "detail": "Rate limit exceeded. Maximum 10 requests per minute."
}
```

---

## Response Metadata

| Field | Type | Description |
|-------|------|-------------|
| `files_processed` | integer | Number of files processed |
| `tokens_used` | integer | Total tokens consumed |
| `generated_at` | string (ISO 8601) | Generation timestamp |