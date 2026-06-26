import fs from 'fs-extra';
import path from 'path';

/**
 * Generate documentation markdown from code analysis without an LLM.
 * Scans project files, extracts metadata, and produces structured docs.
 *
 * @param {string} projectDir - Root directory of the project
 * @param {string} framework - Detected framework type (react-vite, laravel, etc.)
 * @param {Array} codeFiles - Array of {path, content, language} from fileScanner
 * @returns {Record<string, string>} Map of filename to markdown content
 */
export async function generateOfflineDocs(projectDir, framework, codeFiles) {
  const projectMeta = await extractProjectMeta(projectDir);
  const isLargeProject = codeFiles.length >= 15;

  const docs = {};

  docs['README.md'] = generateReadme(projectMeta, framework, codeFiles);
  docs['API.md'] = generateApi(projectMeta, framework, codeFiles);

  if (isLargeProject) {
    docs['ARCHITECTURE.md'] = await generateArchitecture(projectDir, projectMeta, framework, codeFiles);
  }

  return docs;
}

/**
 * Extract project metadata from package.json or composer.json.
 */
async function extractProjectMeta(projectDir) {
  const meta = {
    name: path.basename(projectDir),
    description: '',
    version: '',
    dependencies: {},
    devDependencies: {},
    scripts: {},
    techStack: [],
    packageManager: 'npm',
    entryPoint: '',
  };

  // Try package.json (Node.js projects)
  const pkgPath = path.join(projectDir, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      meta.name = pkg.name || meta.name;
      meta.description = pkg.description || '';
      meta.version = pkg.version || '';
      meta.dependencies = pkg.dependencies || {};
      meta.devDependencies = pkg.devDependencies || {};
      meta.scripts = pkg.scripts || {};
      meta.entryPoint = pkg.main || '';

      // Detect tech stack from deps
      const allDeps = { ...meta.dependencies, ...meta.devDependencies };
      if (allDeps['react']) meta.techStack.push('React');
      if (allDeps['next']) meta.techStack.push('Next.js');
      if (allDeps['vue']) meta.techStack.push('Vue.js');
      if (allDeps['svelte']) meta.techStack.push('Svelte');
      if (allDeps['express']) meta.techStack.push('Express');
      if (allDeps['fastify']) meta.techStack.push('Fastify');
      if (allDeps['koa']) meta.techStack.push('Koa');
      if (allDeps['vite']) meta.techStack.push('Vite');
      if (allDeps['webpack']) meta.techStack.push('Webpack');
      if (allDeps['typescript']) meta.techStack.push('TypeScript');
      if (allDeps['tailwindcss']) meta.techStack.push('Tailwind CSS');
      if (allDeps['prisma'] || allDeps['@prisma/client']) meta.techStack.push('Prisma');
      if (allDeps['mongoose']) meta.techStack.push('Mongoose');
      if (allDeps['sequelize']) meta.techStack.push('Sequelize');
      if (allDeps['socket.io']) meta.techStack.push('Socket.IO');
      if (allDeps['jsonwebtoken']) meta.techStack.push('JWT Auth');
      if (allDeps['bcrypt'] || allDeps['bcryptjs']) meta.techStack.push('bcrypt');
    } catch (e) {
      // ignore parse errors
    }
  }

  // Try composer.json (PHP/Laravel projects)
  const composerPath = path.join(projectDir, 'composer.json');
  if (await fs.pathExists(composerPath)) {
    try {
      const composer = await fs.readJson(composerPath);
      meta.name = composer.name || meta.name;
      meta.description = composer.description || meta.description || '';
      meta.packageManager = 'composer';
      const req = composer.require || {};
      if (req['laravel/framework']) meta.techStack.push('Laravel');
      if (req['php']) meta.techStack.push('PHP');
      meta.dependencies = req;
      meta.devDependencies = composer['require-dev'] || {};
    } catch (e) {
      // ignore
    }
  }

  // Check for yarn.lock or pnpm-lock.yaml
  if (await fs.pathExists(path.join(projectDir, 'yarn.lock'))) {
    meta.packageManager = 'yarn';
  } else if (await fs.pathExists(path.join(projectDir, 'pnpm-lock.yaml'))) {
    meta.packageManager = 'pnpm';
  }

  return meta;
}

/**
 * Generate README.md from project metadata.
 */
function generateReadme(meta, framework, codeFiles) {
  const lines = [];

  lines.push(`# ${meta.name}`);
  lines.push('');

  if (meta.description) {
    lines.push(meta.description);
    lines.push('');
  }

  // Tech stack
  if (meta.techStack.length > 0) {
    lines.push('## Tech Stack');
    lines.push('');
    meta.techStack.forEach(t => lines.push(`- ${t}`));
    lines.push('');
  }

  // Project structure summary
  const languages = {};
  codeFiles.forEach(f => {
    const lang = f.language || 'other';
    languages[lang] = (languages[lang] || 0) + 1;
  });
  lines.push('## Project Overview');
  lines.push('');
  lines.push(`This project contains ${codeFiles.length} source files across the following languages:`);
  lines.push('');
  Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .forEach(([lang, count]) => {
      lines.push(`- **${lang}**: ${count} file${count > 1 ? 's' : ''}`);
    });
  lines.push('');

  // Prerequisites
  lines.push('## Prerequisites');
  lines.push('');
  if (meta.packageManager === 'composer') {
    lines.push('- PHP 8.0 or higher');
    lines.push('- Composer');
  } else {
    lines.push('- Node.js 18 or higher');
    lines.push(`- ${meta.packageManager}`);
  }
  lines.push('');

  // Installation
  lines.push('## Installation');
  lines.push('');
  lines.push('Clone the repository and install dependencies:');
  lines.push('');
  lines.push('```bash');
  lines.push(`git clone <repository-url>`);
  lines.push(`cd ${path.basename(meta.name)}`);

  if (meta.packageManager === 'composer') {
    lines.push('composer install');
  } else {
    lines.push(`${meta.packageManager} install`);
  }
  lines.push('```');
  lines.push('');

  // Available scripts
  const scriptEntries = Object.entries(meta.scripts);
  if (scriptEntries.length > 0) {
    lines.push('## Available Scripts');
    lines.push('');
    lines.push('| Command | Description |');
    lines.push('|---------|-------------|');
    scriptEntries.forEach(([name, cmd]) => {
      lines.push(`| \`${meta.packageManager === 'npm' ? 'npm run ' : meta.packageManager + ' '}${name}\` | \`${cmd}\` |`);
    });
    lines.push('');
  }

  // Quick start
  const devScript = meta.scripts.dev || meta.scripts.start || meta.scripts.serve;
  if (devScript) {
    lines.push('## Quick Start');
    lines.push('');
    lines.push('Start the development server:');
    lines.push('');
    lines.push('```bash');
    const runCmd = meta.scripts.dev ? 'dev' : (meta.scripts.start ? 'start' : 'serve');
    lines.push(`${meta.packageManager === 'npm' ? 'npm run ' : meta.packageManager + ' '}${runCmd}`);
    lines.push('```');
    lines.push('');
  }

  // Dependencies
  const depEntries = Object.entries(meta.dependencies);
  if (depEntries.length > 0) {
    lines.push('## Dependencies');
    lines.push('');
    lines.push('| Package | Version |');
    lines.push('|---------|---------|');
    depEntries.forEach(([name, version]) => {
      lines.push(`| ${name} | ${version} |`);
    });
    lines.push('');
  }

  // License
  lines.push('## License');
  lines.push('');
  lines.push('See the LICENSE file for details.');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate API.md by scanning for route definitions and exported functions.
 */
function generateApi(meta, framework, codeFiles) {
  const lines = [];
  lines.push(`# API Reference`);
  lines.push('');
  lines.push(`Auto-generated API reference for **${meta.name}**.`);
  lines.push('');

  // Extract routes
  const routes = [];
  const exportedFunctions = [];

  for (const file of codeFiles) {
    const content = file.content;
    const filePath = file.path;

    // Express-style routes
    const expressPatterns = [
      /(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    ];
    for (const pattern of expressPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        routes.push({
          method: match[1].toUpperCase(),
          path: match[2],
          file: filePath,
        });
      }
    }

    // FastAPI-style routes
    const fastapiPattern = /@(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/g;
    let faMatch;
    while ((faMatch = fastapiPattern.exec(content)) !== null) {
      routes.push({
        method: faMatch[1].toUpperCase(),
        path: faMatch[2],
        file: filePath,
      });
    }

    // Laravel-style routes
    const laravelPattern = /Route::(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g;
    let laMatch;
    while ((laMatch = laravelPattern.exec(content)) !== null) {
      routes.push({
        method: laMatch[1].toUpperCase(),
        path: laMatch[2],
        file: filePath,
      });
    }

    // Exported functions (JS/TS)
    const exportPattern = /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
    let expMatch;
    while ((expMatch = exportPattern.exec(content)) !== null) {
      exportedFunctions.push({
        name: expMatch[1],
        params: expMatch[2].trim(),
        file: filePath,
      });
    }

    // Python def at module level (not indented)
    if (file.language === 'python') {
      const pyFuncPattern = /^(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)/gm;
      let pyMatch;
      while ((pyMatch = pyFuncPattern.exec(content)) !== null) {
        // Skip private functions
        if (!pyMatch[1].startsWith('_')) {
          exportedFunctions.push({
            name: pyMatch[1],
            params: pyMatch[2].trim(),
            file: filePath,
          });
        }
      }
    }
  }

  // Routes section
  if (routes.length > 0) {
    lines.push('## Routes');
    lines.push('');
    lines.push('| Method | Endpoint | Source |');
    lines.push('|--------|----------|--------|');
    routes.forEach(r => {
      lines.push(`| \`${r.method}\` | \`${r.path}\` | ${r.file} |`);
    });
    lines.push('');
  }

  // Functions section
  if (exportedFunctions.length > 0) {
    // Group by file
    const byFile = {};
    exportedFunctions.forEach(fn => {
      if (!byFile[fn.file]) byFile[fn.file] = [];
      byFile[fn.file].push(fn);
    });

    lines.push('## Functions');
    lines.push('');
    Object.entries(byFile).forEach(([filePath, fns]) => {
      lines.push(`### ${filePath}`);
      lines.push('');
      fns.forEach(fn => {
        const paramStr = fn.params || 'none';
        lines.push(`#### \`${fn.name}(${fn.params})\``);
        lines.push('');
        lines.push(`- **Parameters**: \`${paramStr}\``);
        lines.push(`- **Source**: \`${filePath}\``);
        lines.push('');
      });
    });
  }

  if (routes.length === 0 && exportedFunctions.length === 0) {
    lines.push('No public API routes or exported functions were detected in this project.');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate ARCHITECTURE.md by mapping directory structure and entry points.
 */
async function generateArchitecture(projectDir, meta, framework, codeFiles) {
  const lines = [];
  lines.push(`# Architecture`);
  lines.push('');
  lines.push(`High-level architecture overview for **${meta.name}**.`);
  lines.push('');

  // Map top-level directories
  lines.push('## Directory Structure');
  lines.push('');
  lines.push('```');

  try {
    const entries = await fs.readdir(projectDir, { withFileTypes: true });
    const dirs = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'vendor' && e.name !== '__pycache__')
      .map(e => e.name);
    const files = entries
      .filter(e => e.isFile() && !e.name.startsWith('.'))
      .map(e => e.name);

    dirs.forEach(d => lines.push(`${d}/`));
    files.forEach(f => lines.push(f));
  } catch (e) {
    lines.push('(unable to read directory)');
  }

  lines.push('```');
  lines.push('');

  // Describe known directories
  const dirDescriptions = {
    'src': 'Main application source code',
    'frontend': 'Frontend client application',
    'backend': 'Backend server application',
    'server': 'Server-side code',
    'client': 'Client-side code',
    'api': 'API endpoints and route handlers',
    'lib': 'Shared library code and utilities',
    'utils': 'Utility functions and helpers',
    'components': 'UI components',
    'pages': 'Page-level components or views',
    'routes': 'Route definitions',
    'models': 'Data models and schemas',
    'services': 'Business logic and service layer',
    'controllers': 'Request handlers and controllers',
    'middleware': 'Middleware functions',
    'config': 'Configuration files',
    'scripts': 'Build and automation scripts',
    'public': 'Static public assets',
    'assets': 'Media and static assets',
    'tests': 'Test files',
    'test': 'Test files',
    '__tests__': 'Test files',
    'docs': 'Documentation',
    'database': 'Database migrations and seeds',
    'migrations': 'Database migration files',
    'resources': 'Application resources (views, templates)',
    'app': 'Core application logic',
  };

  lines.push('## Module Descriptions');
  lines.push('');

  try {
    const entries = await fs.readdir(projectDir, { withFileTypes: true });
    const dirs = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'vendor' && e.name !== '__pycache__')
      .map(e => e.name);

    dirs.forEach(d => {
      const desc = dirDescriptions[d.toLowerCase()] || 'Project module';
      lines.push(`- **${d}/**: ${desc}`);
    });
  } catch (e) {
    // skip
  }

  lines.push('');

  // Entry points
  lines.push('## Entry Points');
  lines.push('');

  const entryPointPatterns = [
    'index.js', 'index.ts', 'main.js', 'main.ts', 'main.py',
    'app.js', 'app.ts', 'app.py', 'server.js', 'server.ts',
  ];
  const foundEntries = codeFiles.filter(f => {
    const base = path.basename(f.path);
    return entryPointPatterns.includes(base);
  });

  if (foundEntries.length > 0) {
    foundEntries.forEach(f => {
      lines.push(`- \`${f.path}\``);
    });
  } else {
    lines.push('No standard entry point files detected.');
  }
  lines.push('');

  // Tech stack
  if (meta.techStack.length > 0) {
    lines.push('## Technology Stack');
    lines.push('');
    meta.techStack.forEach(t => lines.push(`- ${t}`));
    lines.push('');
  }

  // Framework info
  lines.push('## Framework');
  lines.push('');
  lines.push(`Detected framework: **${framework}**`);
  lines.push('');

  return lines.join('\n');
}
