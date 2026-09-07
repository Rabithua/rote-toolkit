<p align="right">English | <a href="./README.zh-CN.md">中文</a></p>

# Rote Toolkit

Rote Toolkit is a TypeScript toolkit for connecting to and extending your [Rote](https://rote.ink) note system from terminal workflows and AI agents. It uses the Rote OpenKey API for simple, reusable authentication.

Main project repository: [`Rabithua/rote`](https://github.com/Rabithua/rote).

## Features

- **CLI mode**: quickly create, search, and manage notes from terminal.
- **MCP mode**: run as a Model Context Protocol server so AI tools (Claude/Cursor/VS Code) can safely read and write Rote notes.
- **SDK mode**: import `RoteClient` in your TypeScript/JavaScript projects.
- **Simple auth**: configure OpenKey once and reuse it.

## Install

> Node.js v18 or higher is required.
> Rote Toolkit 0.6.0 requires Rote Server 2.4.0 or later for share-link APIs.

```bash
npm install -g rote-toolkit
```

## Configure Auth

Run this command once:

```bash
rote config
```

You will be prompted for:

1. **Rote API URL**: for example `https://your-rote-domain.com`
2. **OpenKey**: your API key

Credentials are stored at: `~/.rote-toolkit/config.json`.

## CLI Usage

### Notes

```bash
# Create a note
rote add "Today I learned MCP and it is great"

# Create with tags, public, and pinned
rote add "Built a new frontend component" -t "code,frontend,React" --public --pin

# Bind note to an article
rote add "Chapter summary" --article-id "<articleId>"

# Get one note by ID
rote get <noteId>

# Search notes
rote search "MCP" --limit 20

# Search with filters
rote search "MCP" --archived -t "ai,notes"

# List recent notes
rote list --limit 10 --skip 0 --archived -t "knowledge"

# Explore public notes (no auth required)
rote explore --limit 20
```

### Articles

```bash
# Create an article
rote article add "# My Article Content"

# Get, update, or delete an article
rote article get <articleId>
rote article update <articleId> "# Revised content"
rote article delete <articleId>

# List articles
rote articles --limit 20 --skip 0 -k "keyword"
```

### Share Links & Attachments

```bash
# SHAREROTE is required for these commands
rote share status <noteId>
rote share create <noteId>
rote share revoke <noteId>

# Upload explicit image/video paths; Live Photo composition uses the SDK primitives
rote attachment upload <noteId> ./photo.jpg ./clip.mp4
rote attachment delete <attachmentId>
```

### Reactions

```bash
# Add reaction to a note
rote reaction add <noteId> like

# Remove reaction
rote reaction remove <noteId> like
```

### Profile & Permissions

```bash
# Get profile
rote profile get

# Update profile
rote profile update --nickname "New Name" --description "Bio"

# Check API key permissions
rote permissions
```

### Statistics & Data

```bash
# Get tag statistics
rote tags

# Get activity heatmap
rote heatmap --start 2024-01-01 --end 2024-12-31

# Get account statistics
rote stats

# Get settings
rote settings get

# Update settings
rote settings update --allow-explore true
```

## SDK Usage

```typescript
import { RoteClient } from "rote-toolkit";

const client = new RoteClient();

// Create a note
const note = await client.createNote({
  content: "Today I learned MCP",
  title: "Learning Log",
  tags: ["journal", "ai"],
  isPublic: false,
  pin: false,
});

// Update a note
await client.updateNote({
  noteId: "<noteId>",
  title: "Revised title",
  tags: ["knowledge", "rote"],
  isPublic: true,
  archived: false,
});

const current = await client.getNote("<noteId>");

// Search notes
const results = await client.searchNotes({
  keyword: "MCP",
  limit: 20,
  skip: 0,
  tag: ["ai"],
});

// List notes
const notes = await client.listNotes({ limit: 20 });

// Explore public notes
const explore = await client.exploreNotes({ limit: 20 });

// Articles
const article = await client.createArticle({ content: "# Article" });
const articles = await client.listArticles({ limit: 20 });
const articleDetails = await client.getArticle(article.id);
await client.updateArticle({ articleId: article.id, content: "# Revised" });
await client.deleteArticle(article.id);

// Batch operations
const batchNotes = await client.batchGetNotes({ ids: ["id1", "id2"] });

// Reactions
await client.addReaction({ roteid: "<noteId>", type: "like" });
await client.removeReaction({ roteid: "<noteId>", type: "like" });

// Profile & Permissions
const profile = await client.getProfile();
const permissions = await client.getPermissions();

// Statistics
const tags = await client.getTags();
const heatmap = await client.getHeatmap({ startDate: "2024-01-01", endDate: "2024-12-31" });
const stats = await client.getStatistics();

// Settings
const settings = await client.getSettings();
await client.updateSettings({ allowExplore: true });

// Attachments
const upload = await client.presignAttachmentUploads({
  files: [{ filename: "photo.jpg", contentType: "image/jpeg", size: 1234 }],
});
// Refresh only when a reservation's upload credentials have expired.
if (upload.reservationId && upload.expiresAt && Date.parse(upload.expiresAt) <= Date.now()) {
  await client.refreshAttachmentUploadReservation(upload.reservationId);
}
await client.finalizeAttachmentUploads({
  noteId: "<noteId>",
  attachments: [{
    uuid: upload.items[0].uuid,
    originalKey: upload.items[0].original.key,
    mimetype: "image/jpeg",
    size: 1234,
  }],
});
await client.deleteAttachment("<attachmentId>");
await client.batchDeleteAttachments({ ids: ["att1", "att2"] });
await client.updateAttachmentsSortOrder({ noteId: "<noteId>", attachmentIds: ["att1", "att2"] });

// Note share links (SHAREROTE permission required)
const shareState = await client.getNoteShareState("<noteId>");
const share = await client.createResolvedNoteShare("<noteId>");
await client.revokeNoteShare("<noteId>");
```

`createResolvedNoteShare` checks `/v2/api/site/status` before creating a bearer link. It fails without creating a link when the configured frontend URL is missing or invalid. Raw attachment primitives support Live Photo pairs; the CLI never reads files unless their paths are explicitly passed to `attachment upload`.

## MCP Usage

### Do I need pre-installation?

No.
If you configure MCP with `npx` or `bunx`, the package is downloaded and run automatically when the MCP server starts.

Global install is only needed when you want to run commands directly on your machine:

```bash
npm install -g rote-toolkit
```

### 1) Configure credentials first (one time)

```bash
rote config
```

### 2) Manual local start (optional, for debugging)

These two commands are equivalent:

```bash
rote mcp
rote-mcp
```

### 3) Claude Desktop example

```json
{
  "mcpServers": {
    "rote-toolkit": {
      "command": "npx",
      "args": ["-y", "-p", "rote-toolkit@latest", "rote-mcp"]
    }
  }
}
```

### 4) VS Code example

```json
{
  "servers": {
    "rote-toolkit": {
      "type": "stdio",
      "command": "bunx",
      "args": ["-y", "--package", "rote-toolkit@latest", "rote-mcp"]
    }
  }
}
```

### Version strategy

- Track latest: `rote-toolkit@latest`
- Reproducible setup: pin a version, for example `rote-toolkit@0.6.0`

### Common errors

- `could not determine executable to run`: usually incorrect `npx` args, use `-p rote-toolkit@... rote-mcp`.
- `unknown command 'rote-mcp'` (bunx): include `--package`, for example `bunx -y --package rote-toolkit@latest rote-mcp`.

### Available MCP Tools

#### Notes
- `rote_create_note` - Create a note
- `rote_get_note` - Get a note by ID
- `rote_update_note` - Update an existing note
- `rote_delete_note` - Delete a note
- `rote_search_notes` - Search notes by keyword
- `rote_list_notes` - List recent notes
- `rote_explore_notes` - Get public explore notes (no auth required)
- `rote_batch_get_notes` - Batch get notes by IDs (max 100)
- `rote_get_note_share` - Get a note share-link state
- `rote_create_note_share` - Create or return a note share link
- `rote_revoke_note_share` - Revoke a note share link

#### Articles
- `rote_create_article` - Create an article
- `rote_get_article` - Get an article by ID
- `rote_update_article` - Update an article
- `rote_delete_article` - Delete an article
- `rote_list_articles` - List user articles
- `rote_get_article_by_note` - Get article linked to a note

#### Reactions
- `rote_add_reaction` - Add a reaction to a note
- `rote_remove_reaction` - Remove a reaction from a note

#### Profile & Permissions
- `rote_get_profile` - Get user profile
- `rote_update_profile` - Update user profile
- `rote_get_permissions` - Check API key permissions

#### Statistics & Data
- `rote_get_tags` - Get tag usage statistics
- `rote_get_heatmap` - Get activity heatmap
- `rote_get_statistics` - Get user statistics

#### Settings
- `rote_get_settings` - Get user settings
- `rote_update_settings` - Update user settings

#### Attachments
- `rote_delete_attachment` - Delete one attachment
- `rote_batch_delete_attachments` - Batch delete attachments (max 100)
- `rote_update_attachments_sort` - Update attachment sort order

The stdio MCP intentionally has no tool that accepts local file paths. Use the explicit CLI upload command or the SDK attachment primitives instead.

## Local Development

[API Key Usage Guide](./API-KEY-GUIDE.md)

```bash
npm install
npm run build
npm run dev -- --help
```

## Publish to npm

Login first:

```bash
npm login
```

Update the version, test, build, publish, tag, and push from `main`:

```bash
npm run release:patch
```

Also available:

```bash
npm run release:minor
npm run release:major
```

Release script steps:

1. Ensure git workspace is clean
2. Check npm login state
3. Update or verify the target version
4. Run tests and build
5. Run `npm pack --dry-run`
6. Commit any version-file change
7. Publish to npm
8. Create and push the annotated tag
