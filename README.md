<p align="right">English | <a href="./README.zh-CN.md">中文</a></p>

# Rote Toolkit

Rote Toolkit is a TypeScript toolkit for connecting to and extending your [Rote](https://rote.ink) note system from terminal workflows and AI agents. It uses the Rote OpenKey API for simple, reusable authentication.

Main project repository: [`Rabithua/rote`](https://github.com/Rabithua/rote).

## Features

- **CLI mode**: quickly create and search notes from terminal.
- **MCP mode**: run as a Model Context Protocol server so AI tools (Claude/Cursor/VS Code) can safely read and write Rote notes.
- **Simple auth**: configure OpenKey once and reuse it.

## Install

> Node.js v18 or higher is required.

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

### 1) Create a note

```bash
rote add "Today I learned MCP and it is great"
```

Add tags, publish as public, and pin:

```bash
rote add "Built a new frontend component" -t "code,frontend,React" --public --pin
```

### 2) Search and list notes

Search notes containing `MCP`:

```bash
rote search "MCP"
```

List recent notes (with archive/tag filters):

```bash
rote list --limit 5 --archived -t "knowledge"
```

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
- Reproducible setup: pin a version, for example `rote-toolkit@0.3.3`

### Common errors

- `could not determine executable to run`: usually incorrect `npx` args, use `-p rote-toolkit@... rote-mcp`.
- `unknown command 'rote-mcp'` (bunx): include `--package`, for example `bunx -y --package rote-toolkit@latest rote-mcp`.

### Available AI Tools

- `rote_create_note`
- `rote_update_note`
- `rote_delete_note`
- `rote_search_notes`
- `rote_list_notes`

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

Build + bump version + publish:

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
3. `npm run build`
4. `npm pack --dry-run`
5. `npm version <patch|minor|major>`
6. `npm publish`
