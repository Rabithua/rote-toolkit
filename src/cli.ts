#!/usr/bin/env node
import { Command } from 'commander';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { getConfigPath, saveConfig } from './config.js';
import { RoteClient } from './api.js';
import { printNotes } from './output.js';
import { startMcpServer } from './mcp.js';

const program = new Command();

program
  .name('rote')
  .description('Rote Toolkit CLI')
  .version('0.1.0');

program
  .command('login')
  .description('Configure Rote API URL and OpenKey')
  .action(async () => {
    const rl = createInterface({ input, output });
    try {
      const apiUrl = await rl.question('Rote API URL: ');
      const openKey = await rl.question('OpenKey: ');
      saveConfig({ apiUrl, openKey });
      console.log(`Saved config to ${getConfigPath()}`);
    } finally {
      rl.close();
    }
  });

program
  .command('add')
  .description('Create a note')
  .argument('<content>', 'note content')
  .option('-t, --tags <tags>', 'comma-separated tags')
  .option('--title <title>', 'title')
  .option('--state <state>', 'note state', 'private')
  .action(async (content: string, options: { tags?: string; title?: string; state?: string }) => {
    const client = new RoteClient();
    const tags = parseTags(options.tags);
    const note = await client.createNote({
      content,
      tags,
      title: options.title,
      state: options.state,
    });

    console.log(`Created note: ${note.id}`);
  });

program
  .command('search')
  .description('Search notes by keyword')
  .argument('<keyword>', 'search keyword')
  .option('-l, --limit <limit>', 'max results', parseInt, 10)
  .option('-s, --skip <skip>', 'offset', parseInt, 0)
  .action(async (keyword: string, options: { limit: number; skip: number }) => {
    const client = new RoteClient();
    const notes = await client.searchNotes({ keyword, limit: options.limit, skip: options.skip });
    printNotes(notes);
  });

program
  .command('mcp')
  .description('Start MCP server over stdio')
  .action(async () => {
    await startMcpServer();
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
});

function parseTags(tagsRaw?: string): string[] {
  if (!tagsRaw) {
    return [];
  }

  return tagsRaw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}
