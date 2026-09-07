import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { RoteClient } from "./api.js";
import { truncateSingleLine } from "./output.js";
import { packageVersion } from "./version.js";

export async function startMcpServer(): Promise<void> {
  const client = new RoteClient();

  const server = new McpServer({
    name: "rote-toolkit",
    version: packageVersion,
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
    "rote_get_note",
    {
      description: "Get a note by ID through the Rote OpenKey API.",
      inputSchema: {
        noteId: z.string().min(1).describe("Note ID"),
      },
    },
    async ({ noteId }) => {
      const note = await client.getNote(noteId);
      return { content: [{ type: "text", text: JSON.stringify(note, null, 2) }] };
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
    "rote_get_note_share",
    {
      description: "Get the share-link state for a note.",
      inputSchema: {
        noteId: z.string().min(1).describe("Note ID"),
      },
    },
    async ({ noteId }) => ({
      content: [
        { type: "text", text: JSON.stringify(await client.getNoteShareState(noteId), null, 2) },
      ],
    }),
  );

  server.registerTool(
    "rote_create_note_share",
    {
      description: "Create or return a share link for a note.",
      inputSchema: {
        noteId: z.string().min(1).describe("Note ID"),
      },
    },
    async ({ noteId }) => {
      const share = await client.createResolvedNoteShare(noteId);
      return { content: [{ type: "text", text: JSON.stringify(share, null, 2) }] };
    },
  );

  server.registerTool(
    "rote_revoke_note_share",
    {
      description: "Revoke the share link for a note.",
      inputSchema: {
        noteId: z.string().min(1).describe("Note ID"),
      },
    },
    async ({ noteId }) => {
      await client.revokeNoteShare(noteId);
      return { content: [{ type: "text", text: `Revoked share link for note ${noteId}` }] };
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
    "rote_get_article",
    {
      description: "Get an article by ID.",
      inputSchema: {
        articleId: z.string().min(1).describe("Article ID"),
      },
    },
    async ({ articleId }) => ({
      content: [
        { type: "text", text: JSON.stringify(await client.getArticle(articleId), null, 2) },
      ],
    }),
  );

  server.registerTool(
    "rote_update_article",
    {
      description: "Update an article by ID.",
      inputSchema: {
        articleId: z.string().min(1).describe("Article ID"),
        content: z.string().describe("New article content"),
      },
    },
    async ({ articleId, content }) => {
      const article = await client.updateArticle({ articleId, content });
      return { content: [{ type: "text", text: `Updated article ${article.id}` }] };
    },
  );

  server.registerTool(
    "rote_delete_article",
    {
      description: "Delete an article by ID.",
      inputSchema: {
        articleId: z.string().min(1).describe("Article ID"),
      },
    },
    async ({ articleId }) => {
      const article = await client.deleteArticle(articleId);
      return { content: [{ type: "text", text: `Deleted article ${article.id}` }] };
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
          .describe("Optional metadata object. A { source } field is auto-injected as 'mcp' if not provided."),
      },
    },
    async ({ roteid, type, metadata }) => {
      const merged = { source: "mcp" as const, ...metadata };
      const reaction = await client.addReaction({ roteid, type, metadata: merged });
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

  server.registerTool(
    "rote_explore_notes",
    {
      description: "Get explore notes in Rote (no authentication required).",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Max results, default 20"),
        skip: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Pagination offset, default 0"),
      },
    },
    async ({ limit, skip }) => {
      const notes = await client.exploreNotes({ limit, skip });
      const lines = notes.map(
        (note, i) => `${i + 1}. ${truncateSingleLine(note.content, 100)}`,
      );
      return {
        content: [
          {
            type: "text",
            text: lines.length > 0 ? lines.join("\n") : "No explore notes found.",
          },
        ],
      };
    },
  );

  // --- New Extended OpenKey API Tools ---

  server.registerTool(
    "rote_list_articles",
    {
      description: "List user articles in Rote.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Max results, default 20"),
        skip: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Pagination offset, default 0"),
        keyword: z.string().optional().describe("Search keyword"),
      },
    },
    async ({ limit, skip, keyword }) => {
      const articles = await client.listArticles({ limit, skip, keyword });
      const lines = articles.map(
        (article, i) =>
          `${i + 1}. [${article.id}] ${article.title || truncateSingleLine(article.content, 80)}`,
      );
      return {
        content: [
          {
            type: "text",
            text: lines.length > 0 ? lines.join("\n") : "No articles found.",
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_get_article_by_note",
    {
      description: "Get article linked to a note.",
      inputSchema: {
        noteId: z.string().min(1).describe("Note ID"),
      },
    },
    async ({ noteId }) => {
      const article = await client.getArticleByNoteId(noteId);
      if (!article) {
        return {
          content: [{ type: "text", text: "No article linked to this note." }],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Article ${article.id}:\n${truncateSingleLine(article.content, 200)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_batch_get_notes",
    {
      description: "Batch get multiple notes by IDs (max 100).",
      inputSchema: {
        ids: z.array(z.string()).min(1).max(100).describe("Array of note IDs"),
      },
    },
    async ({ ids }) => {
      const notes = await client.batchGetNotes({ ids });
      const lines = notes.map(
        (note, i) => `${i + 1}. [${note.id}] ${truncateSingleLine(note.content, 80)}`,
      );
      return {
        content: [
          {
            type: "text",
            text:
              lines.length > 0
                ? `Found ${notes.length} notes:\n${lines.join("\n")}`
                : "No notes found.",
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_get_tags",
    {
      description: "Get tag usage statistics.",
      inputSchema: {},
    },
    async () => {
      const tags = await client.getTags();
      const lines = tags.map((t) => `${t.tag}: ${t.count}`);
      return {
        content: [
          {
            type: "text",
            text: lines.length > 0 ? lines.join("\n") : "No tags found.",
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_get_heatmap",
    {
      description: "Get activity heatmap for a date range.",
      inputSchema: {
        startDate: z.string().describe("Start date (YYYY-MM-DD)"),
        endDate: z.string().describe("End date (YYYY-MM-DD)"),
      },
    },
    async ({ startDate, endDate }) => {
      const heatmap = await client.getHeatmap({ startDate, endDate });
      const lines = heatmap.map((d) => `${d.date}: ${d.count} notes`);
      return {
        content: [
          {
            type: "text",
            text: lines.length > 0 ? lines.join("\n") : "No activity in this range.",
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_get_statistics",
    {
      description: "Get user statistics (note count, attachment count).",
      inputSchema: {},
    },
    async () => {
      const stats = await client.getStatistics();
      return {
        content: [
          {
            type: "text",
            text: `Rotes: ${stats.roteCount}, Attachments: ${stats.attachmentCount}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_get_settings",
    {
      description: "Get user settings.",
      inputSchema: {},
    },
    async () => {
      const settings = await client.getSettings();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(settings, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_update_settings",
    {
      description: "Update user settings.",
      inputSchema: {
        allowExplore: z
          .boolean()
          .optional()
          .describe("Allow public notes to appear in explore"),
      },
    },
    async ({ allowExplore }) => {
      const settings = await client.updateSettings({ allowExplore });
      return {
        content: [
          {
            type: "text",
            text: `Settings updated: ${JSON.stringify(settings)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_delete_attachment",
    {
      description: "Delete one attachment by ID.",
      inputSchema: {
        attachmentId: z.string().min(1).describe("Attachment ID"),
      },
    },
    async ({ attachmentId }) => {
      const result = await client.deleteAttachment(attachmentId);
      return { content: [{ type: "text", text: `Deleted attachment count: ${result.count}` }] };
    },
  );

  server.registerTool(
    "rote_batch_delete_attachments",
    {
      description: "Batch delete attachments by IDs (max 100).",
      inputSchema: {
        ids: z.array(z.string()).min(1).max(100).describe("Array of attachment IDs"),
      },
    },
    async ({ ids }) => {
      const result = await client.batchDeleteAttachments({ ids });
      return {
        content: [
          {
            type: "text",
            text: `Deleted attachment count: ${result.count}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "rote_update_attachments_sort",
    {
      description: "Update attachments sort order for a note.",
      inputSchema: {
        noteId: z.string().min(1).describe("Note ID"),
        attachmentIds: z
          .array(z.string())
          .min(1)
          .describe("Ordered array of attachment IDs"),
      },
    },
    async ({ noteId, attachmentIds }) => {
      await client.updateAttachmentsSortOrder({ noteId, attachmentIds });
      return {
        content: [
          {
            type: "text",
            text: `Updated attachment order for note ${noteId}`,
          },
        ],
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
