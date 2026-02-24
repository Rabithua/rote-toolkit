#!/usr/bin/env node
import { Command } from "commander";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { getConfigPath, saveConfig } from "./config.js";
import { RoteClient } from "./api.js";
import { printNotes } from "./output.js";
import { startMcpServer } from "./mcp.js";

const program = new Command();

program.name("rote").description("Rote Toolkit CLI").version("0.1.0");

program
  .command("login")
  .description("Configure Rote API URL and OpenKey")
  .action(async () => {
    const rl = createInterface({ input, output });
    try {
      const apiUrl = await rl.question("Rote API URL: ");
      const openKey = await rl.question("OpenKey: ");
      saveConfig({ apiUrl, openKey });
      console.log(`Saved config to ${getConfigPath()}`);
    } finally {
      rl.close();
    }
  });

program
  .command("add")
  .description("Create a note")
  .argument("<content>", "note content")
  .option("-t, --tags <tags>", "comma-separated tags")
  .option("--title <title>", "title")
  .option("--state <state>", "note state", "private")
  .option("--article-id <articleId>", "bind to an existing article")
  .action(
    async (
      content: string,
      options: {
        tags?: string;
        title?: string;
        state?: string;
        articleId?: string;
      },
    ) => {
      const client = new RoteClient();
      const tags = parseTags(options.tags);
      const note = await client.createNote({
        content,
        tags,
        title: options.title,
        state: options.state,
        articleId: options.articleId,
      });

      console.log(`Created note: ${note.id}`);
    },
  );

program
  .command("article")
  .description("Manage articles")
  .argument("<action>", "action to perform (add)")
  .argument("[content]", "article content")
  .action(async (action: string, content?: string) => {
    if (action === "add" && content) {
      const client = new RoteClient();
      const article = await client.createArticle({ content });
      console.log(`Created article: ${article.id}`);
    } else {
      console.error("Invalid action or missing content");
    }
  });

program
  .command("reaction")
  .description("Manage reactions")
  .argument("<action>", "action to perform (add|remove)")
  .argument("<roteid>", "note ID")
  .argument("<type>", "reaction type (e.g., like)")
  .action(async (action: string, roteid: string, type: string) => {
    const client = new RoteClient();
    if (action === "add") {
      const reaction = await client.addReaction({ roteid, type });
      console.log(`Added reaction: ${reaction.id}`);
    } else if (action === "remove") {
      const result = await client.removeReaction({ roteid, type });
      console.log(`Removed reactions count: ${result.count}`);
    } else {
      console.error("Invalid action");
    }
  });

program
  .command("profile")
  .description("Manage user profile")
  .argument("<action>", "action to perform (get|update)")
  .option("--nickname <nickname>", "new nickname")
  .option("--description <description>", "new description")
  .option("--username <username>", "new username")
  .action(
    async (
      action: string,
      options: { nickname?: string; description?: string; username?: string },
    ) => {
      const client = new RoteClient();
      if (action === "get") {
        const profile = await client.getProfile();
        console.log(JSON.stringify(profile, null, 2));
      } else if (action === "update") {
        const profile = await client.updateProfile({
          nickname: options.nickname,
          description: options.description,
          username: options.username,
        });
        console.log(`Updated profile for: ${profile.username}`);
      } else {
        console.error("Invalid action");
      }
    },
  );

program
  .command("permissions")
  .description("Check API key permissions")
  .action(async () => {
    const client = new RoteClient();
    const result = await client.getPermissions();
    console.log(`Permissions: ${result.permissions.join(", ")}`);
  });

program
  .command("search")
  .description("Search notes by keyword")
  .argument("<keyword>", "search keyword")
  .option("-l, --limit <limit>", "max results", parseInt, 10)
  .option("-s, --skip <skip>", "offset", parseInt, 0)
  .action(async (keyword: string, options: { limit: number; skip: number }) => {
    const client = new RoteClient();
    const notes = await client.searchNotes({
      keyword,
      limit: options.limit,
      skip: options.skip,
    });
    printNotes(notes);
  });

program
  .command("mcp")
  .description("Start MCP server over stdio")
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
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
