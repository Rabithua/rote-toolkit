import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod/v4';
import { RoteClient } from './api.js';
import { truncateSingleLine } from './output.js';

export async function startMcpServer(): Promise<void> {
  const client = new RoteClient();

  const server = new McpServer({
    name: 'rote-toolkit',
    version: '0.1.0',
  });

  server.registerTool(
    'rote_create_note',
    {
      description: 'Create a note in Rote via OpenKey API.',
      inputSchema: {
        content: z.string().min(1).describe('Note content'),
        title: z.string().optional().describe('Optional note title'),
        tags: z.array(z.string()).optional().describe('Optional list of tags'),
        state: z.string().optional().describe('Note state, default private'),
      },
    },
    async ({ content, title, tags, state }) => {
      const note = await client.createNote({ content, title, tags, state });
      return {
        content: [
          {
            type: 'text',
            text: `Created note ${note.id}: ${truncateSingleLine(note.content, 100)}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    'rote_search_notes',
    {
      description: 'Search notes in Rote by keyword.',
      inputSchema: {
        keyword: z.string().min(1).describe('Search keyword'),
        limit: z.number().int().min(1).max(50).optional().describe('Max results, default 10'),
        skip: z.number().int().min(0).optional().describe('Pagination offset, default 0'),
      },
    },
    async ({ keyword, limit, skip }) => {
      const notes = await client.searchNotes({ keyword, limit, skip });
      const lines = notes.map((note, i) => `${i + 1}. ${truncateSingleLine(note.content, 100)}`);
      return {
        content: [
          {
            type: 'text',
            text: lines.length > 0 ? lines.join('\n') : 'No notes found.',
          },
        ],
      };
    }
  );

  server.registerTool(
    'rote_list_notes',
    {
      description: 'List recent notes in Rote.',
      inputSchema: {
        limit: z.number().int().min(1).max(50).optional().describe('Max results, default 10'),
        skip: z.number().int().min(0).optional().describe('Pagination offset, default 0'),
      },
    },
    async ({ limit, skip }) => {
      const notes = await client.listNotes({ limit, skip });
      const lines = notes.map((note, i) => `${i + 1}. ${truncateSingleLine(note.content, 100)}`);
      return {
        content: [
          {
            type: 'text',
            text: lines.length > 0 ? lines.join('\n') : 'No notes found.',
          },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
