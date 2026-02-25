import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { RoteClient } from "./api.js";
import { truncateSingleLine } from "./output.js";

export async function startMcpServer(): Promise<void> {
  const client = new RoteClient();

  const server = new McpServer({
    name: "rote-toolkit",
    version: "0.1.0",
  });

  server.registerTool(
    "rote_create_note",
    {
      description: "Create a note in Rote via OpenKey API.",
      inputSchema: {
        content: z.string().min(1).describe("Note content"),
        title: z.string().optional().describe("Optional note title"),
        tags: z.array(z.string()).optional().describe("Optional list of tags"),
        isPublic: z.boolean().optional().describe("Publish as public note"),
        pin: z.boolean().optional().describe("Whether to pin the note"),
        articleId: z
          .string()
          .optional()
          .describe("Optional article ID to bind to"),
      },
    },
    async ({ content, title, tags, isPublic, pin, articleId }) => {
      const note = await client.createNote({
        content,
        title,
        tags,
        isPublic,
        pin,
        articleId,
      });
      return {
        content: [
          {
            type: "text",
            text: `Created note ${note.id}: ${truncateSingleLine(note.content, 100)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_update_note",
    {
      description: "Update an existing note in Rote via OpenKey API.",
      inputSchema: {
        noteId: z.string().min(1).describe("Note ID"),
        content: z.string().optional().describe("Updated note content"),
        title: z.string().optional().describe("Updated note title"),
        tags: z.array(z.string()).optional().describe("Updated list of tags"),
        isPublic: z
          .boolean()
          .optional()
          .describe("Set note visibility (public/private)"),
        pin: z.boolean().optional().describe("Whether to pin the note"),
        archived: z.boolean().optional().describe("Whether to archive the note"),
        articleId: z
          .string()
          .optional()
          .describe("Optional article ID to bind to"),
      },
    },
    async ({ noteId, content, title, tags, isPublic, pin, archived, articleId }) => {
      const note = await client.updateNote({
        noteId,
        content,
        title,
        tags,
        isPublic,
        pin,
        archived,
        articleId,
      });
      return {
        content: [
          {
            type: "text",
            text: `Updated note ${note.id}: ${truncateSingleLine(note.content, 100)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_delete_note",
    {
      description: "Delete a note in Rote via OpenKey API.",
      inputSchema: {
        noteId: z.string().min(1).describe("Note ID"),
      },
    },
    async ({ noteId }) => {
      await client.deleteNote(noteId);
      return {
        content: [
          {
            type: "text",
            text: `Deleted note ${noteId}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_create_article",
    {
      description: "Create an article in Rote via OpenKey API.",
      inputSchema: {
        content: z.string().min(1).describe("Article content"),
      },
    },
    async ({ content }) => {
      const article = await client.createArticle({ content });
      return {
        content: [
          {
            type: "text",
            text: `Created article ${article.id}: ${truncateSingleLine(article.content, 100)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_add_reaction",
    {
      description: "Add a reaction to a note.",
      inputSchema: {
        roteid: z.string().describe("Note ID"),
        type: z.string().describe("Reaction type (e.g., like)"),
        metadata: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Optional metadata"),
      },
    },
    async ({ roteid, type, metadata }) => {
      const reaction = await client.addReaction({ roteid, type, metadata });
      return {
        content: [
          {
            type: "text",
            text: `Added reaction ${reaction.id} of type ${reaction.type} to note ${reaction.roteid}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_remove_reaction",
    {
      description: "Remove a reaction from a note.",
      inputSchema: {
        roteid: z.string().describe("Note ID"),
        type: z.string().describe("Reaction type (e.g., like)"),
      },
    },
    async ({ roteid, type }) => {
      const result = await client.removeReaction({ roteid, type });
      return {
        content: [
          {
            type: "text",
            text: `Removed reactions count: ${result.count}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_get_profile",
    {
      description: "Get user profile information.",
      inputSchema: {},
    },
    async () => {
      const profile = await client.getProfile();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(profile, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_update_profile",
    {
      description: "Update user profile information.",
      inputSchema: {
        nickname: z.string().optional().describe("New nickname"),
        description: z.string().optional().describe("New description"),
        avatar: z.string().optional().describe("New avatar URL"),
        cover: z.string().optional().describe("New cover URL"),
        username: z.string().optional().describe("New username"),
      },
    },
    async ({ nickname, description, avatar, cover, username }) => {
      const profile = await client.updateProfile({
        nickname,
        description,
        avatar,
        cover,
        username,
      });
      return {
        content: [
          {
            type: "text",
            text: `Updated profile for: ${profile.username}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_get_permissions",
    {
      description: "Check API key permissions.",
      inputSchema: {},
    },
    async () => {
      const result = await client.getPermissions();
      return {
        content: [
          {
            type: "text",
            text: `Permissions: ${result.permissions.join(", ")}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_search_notes",
    {
      description: "Search notes in Rote by keyword.",
      inputSchema: {
        keyword: z.string().min(1).describe("Search keyword"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Max results, default 10"),
        skip: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Pagination offset, default 0"),
        archived: z.boolean().optional().describe("Include archived notes"),
        tag: z.array(z.string()).optional().describe("Tag filter"),
      },
    },
    async ({ keyword, limit, skip, archived, tag }) => {
      const notes = await client.searchNotes({
        keyword,
        limit,
        skip,
        archived,
        tag,
      });
      const lines = notes.map(
        (note, i) => `${i + 1}. ${truncateSingleLine(note.content, 100)}`,
      );
      return {
        content: [
          {
            type: "text",
            text: lines.length > 0 ? lines.join("\n") : "No notes found.",
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_list_notes",
    {
      description: "List recent notes in Rote.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Max results, default 10"),
        skip: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Pagination offset, default 0"),
        archived: z.boolean().optional().describe("Include archived notes"),
        tag: z.array(z.string()).optional().describe("Tag filter"),
      },
    },
    async ({ limit, skip, archived, tag }) => {
      const notes = await client.listNotes({ limit, skip, archived, tag });
      const lines = notes.map(
        (note, i) => `${i + 1}. ${truncateSingleLine(note.content, 100)}`,
      );
      return {
        content: [
          {
            type: "text",
            text: lines.length > 0 ? lines.join("\n") : "No notes found.",
          },
        ],
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
