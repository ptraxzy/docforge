import chalk from 'chalk';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

export async function serve(options) {
  const port = options.port || process.env.PORT || '8000';
  const aiUrl = options.aiUrl || process.env.AI_BASE_URL || 'http://localhost:11434/v1';
  const aiModel = options.aiModel || process.env.AI_MODEL || 'llama3';
  const aiKey = options.aiKey || process.env.AI_API_KEY || '';

  console.log(chalk.blue('🔧 DocForge Server\n'));
  console.log(chalk.gray(`   AI Provider:  ${aiUrl}`));
  console.log(chalk.gray(`   AI Model:     ${aiModel}`));
  console.log(chalk.gray(`   API Key:      ${aiKey ? '***' + aiKey.slice(-4) : '(none — self-hosted mode)'}`));
  console.log(chalk.gray(`   Port:         ${port}\n`));

  // Get server path (relative to this file)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const serverPath = path.join(__dirname, '..', '..', '..', 'server');

  // Check if server exists
  if (!fs.existsSync(serverPath)) {
    console.log(chalk.red('❌ Server directory not found.'));
    console.log(chalk.gray(`Expected at: ${serverPath}`));
    console.log(chalk.blue('\nTo run the server, you need the full DocForge repo.'));
    console.log(chalk.gray('The CLI is designed to connect to a remote server.'));
    console.log(chalk.gray('Or clone the full repo and run the server separately.\n'));
    process.exit(1);
  }

  console.log(chalk.green(`Starting server on port ${port}...\n`));

  // Set up environment
  const env = { ...process.env };
  env.AI_BASE_URL = aiUrl;
  env.AI_MODEL = aiModel;
  if (aiKey) {
    env.AI_API_KEY = aiKey;
  }
  env.PORT = port;

  // Run uvicorn
  const serverProcess = spawn('uvicorn', ['main:app', '--host', '0.0.0.0', '--port', port], {
    cwd: serverPath,
    env,
    stdio: 'inherit',
  });

  serverProcess.on('error', (err) => {
    console.log(chalk.red(`\n❌ Failed to start server: ${err.message}`));
    console.log(chalk.yellow('\nMake sure Python and uvicorn are installed:'));
    console.log(chalk.gray('   cd server && pip install -r requirements.txt\n'));
    process.exit(1);
  });

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nShutting down server...'));
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
}
