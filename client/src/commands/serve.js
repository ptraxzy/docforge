import chalk from 'chalk';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

export async function serve(options) {
  const port = options.port || process.env.PORT || '8000';

  console.log(chalk.blue('DocForge Server'));
  console.log(chalk.dim.gray('by xputra.dev\n'));
  console.log(chalk.gray(`   Port:         ${port}\n`));

  // Get server path (relative to this file)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const serverPath = path.join(__dirname, '..', '..', '..', 'server');

  // Check if server exists
  if (!fs.existsSync(serverPath)) {
    console.log(chalk.red('[Error] Server directory not found.'));
    console.log(chalk.gray(`Expected at: ${serverPath}`));
    console.log(chalk.blue('\nTo run the server, you need the full DocForge repo.'));
    console.log(chalk.gray('The CLI is designed to connect to a remote server.'));
    console.log(chalk.gray('Or clone the full repo and run the server separately.\n'));
    process.exit(1);
  }

  console.log(chalk.green(`Starting server on port ${port}...\n`));

  // Set up environment
  const env = { ...process.env };
  env.PORT = port;

  // Run uvicorn
  const serverProcess = spawn('uvicorn', ['main:app', '--host', '0.0.0.0', '--port', port], {
    cwd: serverPath,
    env,
    stdio: 'inherit',
  });

  serverProcess.on('error', (err) => {
    console.log(chalk.red(`\n[Error] Failed to start server: ${err.message}`));
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
