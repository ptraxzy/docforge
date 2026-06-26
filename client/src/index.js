#!/usr/bin/env node

import { Command } from 'commander';
import { generate } from './commands/generate.js';
import { init } from './commands/init.js';
import { serve } from './commands/serve.js';
import { buildSite } from './commands/buildSite.js';
import { setServerUrl, getServerUrl } from './utils/config.js';
import { startUpdateCheck, displayUpdateMessage } from './utils/updateChecker.js';
import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
const VERSION = packageJson.version;

// Start checking for updates in the background immediately
startUpdateCheck();

const program = new Command();

program.hook('preAction', async () => {
  await displayUpdateMessage(program.version());
});

program
  .name('docforge')
  .description('AI-powered documentation generator - open source')
  .version(VERSION);

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
  .option('-o, --output <dir>', 'Output directory', './')
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

// Build docs site command
program
  .command('build-site')
  .description('Build a premium documentation website from markdown files')
  .option('-i, --input <dir>', 'Directory containing markdown files', './docs')
  .option('-o, --output <dir>', 'Output directory (only applicable for static HTML)', './docs-site')
  .option('--compile-only', 'Compile existing markdown files directly without calling the AI')
  .action(buildSite);

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
  .action(serve);

// Self-update command
program
  .command('update')
  .description('Update DocForge to the latest version')
  .action(() => {
    console.log(chalk.yellow('Checking and updating DocForge to the latest version...'));
    try {
      execSync('npm install -g @ultramaxoo/docforge', { stdio: 'inherit' });
      console.log(chalk.green('\n[Success] DocForge has been updated successfully!'));
    } catch (error) {
      console.error(chalk.red(`\n[Error] Failed to update: ${error.message}`));
      console.log(chalk.yellow('Please try running: npm install -g @ultramaxoo/docforge manually.'));
    }
  });

async function showMainMenu() {
  await displayUpdateMessage(program.version());
  console.log(chalk.bold.blue('DocForge - Interactive Control Panel'));
  console.log(chalk.dim.gray('by xputra.dev\n'));
  
  const response = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { title: 'Generate Documentation (AI)', value: 'generate' },
      { title: 'Build Documentation Site', value: 'buildSite' },
      { title: 'Configure Server URL', value: 'serverUrl' },
      { title: 'Check Server Health', value: 'health' },
      { title: 'Exit', value: 'exit' }
    ]
  });

  if (response.action === 'generate') {
    await generate(process.cwd(), {});
  } else if (response.action === 'buildSite') {
    await buildSite({});
  } else if (response.action === 'serverUrl') {
    const currentUrl = getServerUrl();
    console.log(chalk.gray(`\nCurrent Server URL: ${currentUrl}`));
    const urlResp = await prompts({
      type: 'text',
      name: 'url',
      message: 'Enter new server URL:',
      initial: currentUrl
    });
    if (urlResp.url) {
      setServerUrl(urlResp.url);
      console.log(chalk.green(`Server URL successfully set to: ${urlResp.url}\n`));
    }
  } else if (response.action === 'health') {
    const currentUrl = getServerUrl();
    console.log(chalk.yellow(`\nChecking connection to ${currentUrl}/health...`));
    try {
      const { default: axios } = await import('axios');
      const res = await axios.get(`${currentUrl}/health`, { timeout: 5000 });
      if (res.status === 200 && res.data.status === 'healthy') {
        console.log(chalk.green('[OK] Server is healthy and connected to AI provider!'));
        console.log(chalk.gray(`   Model in use: ${res.data.ai_provider?.model || 'unknown'}\n`));
      } else {
        console.log(chalk.red(`[Error] Server returned unexpected status: ${res.status}\n`));
      }
    } catch (e) {
      console.log(chalk.red(`[Error] Cannot connect to server at ${currentUrl}: ${e.message}\n`));
    }
  } else {
    console.log(chalk.gray('Goodbye!'));
    await displayUpdateMessage(program.version());
    process.exit(0);
  }

  // Display update warning if package update is available on exit
  await displayUpdateMessage(program.version());
}

if (process.argv.length === 2) {
  showMainMenu();
} else {
  program.parse();
}
