import { diffLines } from 'diff';
import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';

/**
 * Print a Git-like colored unified diff in the terminal.
 */
export function printDiff(filename, oldContent, newContent) {
  console.log(chalk.bold.cyan(`\n--- a/${filename}`));
  console.log(chalk.bold.cyan(`+++ b/${filename}\n`));

  const changes = diffLines(oldContent, newContent);
  
  changes.forEach((part) => {
    const lines = part.value.split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    
    lines.forEach((line) => {
      if (part.added) {
        console.log(chalk.green(`+ ${line}`));
      } else if (part.removed) {
        console.log(chalk.red(`- ${line}`));
      } else {
        console.log(chalk.gray(`  ${line}`));
      }
    });
  });
  console.log();
}

/**
 * Prompt the user to Save, Preview, or Discard the changes.
 */
export async function confirmAndSaveDocs(docsMap, outputDir, refineContext = null) {
  let currentDocs = { ...docsMap };
  let printSummary = true;

  while (true) {
    const fileStatuses = [];
    const diffsToPreview = [];

    for (const [filename, newContent] of Object.entries(currentDocs)) {
      const outputPath = path.join(outputDir, filename);
      const fileExists = await fs.pathExists(outputPath);
      
      if (fileExists) {
        const oldContent = await fs.readFile(outputPath, 'utf-8');
        if (oldContent.trim() === newContent.trim()) {
          fileStatuses.push({ filename, status: 'unchanged' });
        } else {
          fileStatuses.push({ filename, status: 'modified' });
          diffsToPreview.push({ filename, oldContent, newContent });
        }
      } else {
        fileStatuses.push({ filename, status: 'new' });
        diffsToPreview.push({ filename, oldContent: '', newContent });
      }
    }

    if (printSummary) {
      console.log(chalk.blue('\nAI has generated/updated documentation:'));
      fileStatuses.forEach(f => {
        if (f.status === 'new') {
          console.log(chalk.green(`   [NEW]      ${f.filename}`));
        } else if (f.status === 'modified') {
          console.log(chalk.yellow(`   [MODIFIED] ${f.filename}`));
        } else {
          console.log(chalk.gray(`   [UNCHANGED] ${f.filename}`));
        }
      });
      console.log();
      printSummary = false;
    }

    const response = await prompts({
      type: 'text',
      name: 'feedback',
      message: 'Chat with AI to refine, or [y]es to save all, [n]o to discard (type /help for options):',
      validate: input => input.trim().length > 0 ? true : 'Please enter feedback, a shortcut, or a slash command'
    });

    if (response.feedback === undefined) {
      console.log(chalk.yellow('\nChanges discarded.'));
      return false;
    }

    const input = response.feedback.trim();
    const cmd = input.toLowerCase();

    // Map direct/shortcut choices to slash commands
    let isCommand = false;
    let targetCommand = '';

    if (input.startsWith('/')) {
      isCommand = true;
      targetCommand = input.split(' ')[0].toLowerCase();
    } else if (cmd === 'y' || cmd === 'yes') {
      isCommand = true;
      targetCommand = '/save';
    } else if (cmd === 'n' || cmd === 'no') {
      isCommand = true;
      targetCommand = '/discard';
    } else if (cmd === 'd' || cmd === 'diff') {
      isCommand = true;
      targetCommand = '/diff';
    } else if (cmd === 'h' || cmd === 'help') {
      isCommand = true;
      targetCommand = '/help';
    }

    if (isCommand) {
      if (targetCommand === '/save' || targetCommand === '/s') {
        await fs.ensureDir(outputDir);
        for (const [filename, newContent] of Object.entries(currentDocs)) {
          const outputPath = path.join(outputDir, filename);
          await fs.writeFile(outputPath, newContent, 'utf-8');
          console.log(chalk.green(`   [Wrote] ${filename}`));
        }
        console.log(chalk.blue(`\nDocumentation successfully saved to: ${outputDir}/\n`));
        return true;
      } else if (targetCommand === '/diff' || targetCommand === '/d') {
        if (diffsToPreview.length === 0) {
          console.log(chalk.gray('No changes to show.\n'));
        } else {
          diffsToPreview.forEach(diffInfo => {
            printDiff(diffInfo.filename, diffInfo.oldContent, diffInfo.newContent);
          });
        }
      } else if (targetCommand === '/discard' || targetCommand === '/q' || targetCommand === '/exit' || targetCommand === '/quit') {
        console.log(chalk.yellow('\nChanges discarded.'));
        return false;
      } else if (targetCommand === '/help' || targetCommand === '/h') {
        console.log(chalk.bold.blue('\nAvailable Commands:'));
        console.log(`  ${chalk.cyan('y, yes, /save')}      - Save all changes to disk and exit`);
        console.log(`  ${chalk.cyan('n, no, /discard')}    - Discard all changes and exit`);
        console.log(`  ${chalk.cyan('d, diff, /diff')}     - Preview differences (Unified Diff)`);
        console.log(`  ${chalk.cyan('h, help, /help')}     - Show this help menu\n`);
      } else {
        console.log(chalk.red(`\nUnknown command: ${targetCommand}. Type /help for options.\n`));
      }
    } else {
      if (!refineContext || !refineContext.serverUrl) {
        console.log(chalk.red('\n[Error] Refinement is only available when connected to the AI server.\n'));
        continue;
      }

      console.log(chalk.blue('\n🧠 AI is thinking and refining documents... Please wait.\n'));
      try {
        const res = await axios.post(`${refineContext.serverUrl}/refine`, {
          project_name: refineContext.projectName,
          files: refineContext.files,
          current_docs: currentDocs,
          feedback: input,
          framework: refineContext.framework,
          options: refineContext.options,
        }, {
          timeout: 600000, // 10 min
          headers: {
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true',
          },
        });

        if (res.data && res.data.success) {
          currentDocs = res.data.docs;
          console.log(chalk.green(`\n[Success] Refinement applied! Tokens used: ${res.data.metadata.tokens_used}`));
          printSummary = true;
        } else {
          console.log(chalk.red(`\n[Error] Refinement failed: ${res.data.error || 'Unknown error'}\n`));
        }
      } catch (err) {
        console.log(chalk.red(`\n[Error] Refinement failed: ${err.message}\n`));
      }
    }
  }
}
