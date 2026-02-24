#!/usr/bin/env node
import { startMcpServer } from './mcp.js';

startMcpServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to start MCP server: ${message}`);
  process.exit(1);
});
