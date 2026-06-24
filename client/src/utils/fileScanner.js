import fs from 'fs-extra';
import path from 'path';
import fg from 'fast-glob';

// Language detection based on extension
const LANG_MAP = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.pyw': 'python',
  '.go': 'go',
  '.java': 'java',
  '.rb': 'ruby',
  '.php': 'php',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.rs': 'rust',
  '.scala': 'scala',
  '.r': 'r',
  '.lua': 'lua',
  '.pl': 'perl',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
};

const DEFAULT_INCLUDE = [
  '**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx',
  '**/*.py', '**/*.go', '**/*.java', '**/*.rb',
  '**/*.php', '**/*.c', '**/*.cpp', '**/*.cs',
  '**/*.swift', '**/*.kt', '**/*.rs'
];

const DEFAULT_EXCLUDE = [
  'node_modules/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/*.test.js',
  '**/*.test.ts',
  '**/*.spec.js',
  '**/*.spec.ts',
  '**/__tests__/**',
  '**/*.min.js',
  '**/.*'
];

/**
 * Scan a directory for code files
 * @param {string} dirPath - Directory to scan
 * @param {string[]} includePatterns - Glob patterns to include
 * @param {string[]} excludePatterns - Glob patterns to exclude
 * @returns {Promise<Array>} Array of {path, content, language}
 */
export async function scanCodeFiles(dirPath, includePatterns = null, excludePatterns = null) {
  const includes = includePatterns || DEFAULT_INCLUDE;
  const excludes = excludePatterns || DEFAULT_EXCLUDE;

  const files = [];

  for (const pattern of includes) {
    const matched = await fg(pattern, {
      cwd: dirPath,
      onlyFiles: true,
      absolute: false,
      ignore: excludes,
    });

    for (const filePath of matched) {
      const fullPath = path.join(dirPath, filePath);
      
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const ext = path.extname(filePath);
        const language = LANG_MAP[ext] || 'text';

        files.push({
          path: filePath,
          content,
          language,
        });
      } catch (e) {
        // Skip files that can't be read
      }
    }
  }

  // Deduplicate
  const unique = [];
  const seen = new Set();
  for (const f of files) {
    if (!seen.has(f.path)) {
      seen.add(f.path);
      unique.push(f);
    }
  }

  return unique;
}

/**
 * Get project name from directory
 */
export function getProjectName(dirPath) {
  return path.basename(dirPath).replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'my-project';
}
