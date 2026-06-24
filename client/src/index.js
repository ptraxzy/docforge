#!/usr/bin/env node

import { Command } from 'commander';
import { generate } from './commands/generate.js';
import { init } from './commands/init.js';
import { serve } from './commands/serve.js';
import { setServerUrl, getServerUrl } from './utils/config.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('docforge')
  .description('AI-powered documentation generator - open source')
  .version('0.1.0');

// Set server URL
program
  .command('set-server <url>')
  .description('Set the DocForge server URL')
  .action((url) => {
    setServerUrl(url);
    console.log(chalk.green(`Server URL set to: ${url}`));
  });

// Get server URL
program
  .command('get-server')
  .description('Show current server URL')
  .action(() => {
    const url = getServerUrl();
    if (url) {
      console.log(chalk.blue(`Server URL: ${url}`));
    } else {
      console.log(chalk.yellow('No server URL configured. Run: docforge set-server <url>'));
    }
  });

// Generate docs command
program
  .command('generate [path]')
  .description('Generate documentation for a project')
  .option('-o, --output <dir>', 'Output directory', './docs')
  .option('-s, --server <url>', 'Server URL override')
  .option('-i, --include <patterns...>', 'File patterns to include')
  .option('-e, --exclude <patterns...>', 'File patterns to exclude')
  .option('--readme', 'Generate README.md')
  .option('--no-readme', 'Do not generate README.md')
  .option('--api', 'Generate API.md')
  .option('--no-api', 'Do not generate API.md')
  .option('--architecture', 'Generate ARCHITECTURE.md')
  .option('--no-architecture', 'Do not generate ARCHITECTURE.md')
  .option('--changelog', 'Generate CHANGELOG.md')
  .option('--no-changelog', 'Do not generate CHANGELOG.md')
  .action(generate);

// Initialize docforge in current directory
program
  .command('init')
  .description('Initialize DocForge in current project')
  .action(init);

// Start local server (if user wants to self-host)
program
  .command('serve')
  .description('Start the DocForge server locally')
  .option('-p, --port <port>', 'Port to listen on', '8000')
  .option('--ai-url <url>', 'AI provider base URL (OpenAI-compatible)')
  .option('--ai-model <model>', 'AI model name')
  .option('--ai-key <key>', 'AI provider API key (optional for self-hosted)')
  .action(serve);

program.parse();
