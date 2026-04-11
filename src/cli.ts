#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { getConfigPath, saveConfig } from "./config.js";
import { RoteClient } from "./api.js";
import { printNotes } from "./output.js";
import { startMcpServer } from "./mcp.js";

const program = new Command();
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version?: string };
const cliVersion = packageJson.version ?? "0.0.0";

program.name("rote").description("Rote Toolkit CLI").version(cliVersion);

program
  .command("config")
  .alias("login")
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
  .option("--public", "publish as public note")
  .option("--pin", "pin the note")
  .option("--article-id <articleId>", "bind to an existing article")
  .action(
    async (
      content: string,
      options: {
        tags?: string;
        title?: string;
        public?: boolean;
        pin?: boolean;
        articleId?: string;
      },
    ) => {
      const client = new RoteClient();
      const tags = parseTags(options.tags);
      const note = await client.createNote({
        content,
        tags,
        title: options.title,
        isPublic: options.public,
        pin: options.pin,
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
  .option("--avatar <url>", "new avatar URL")
  .option("--cover <url>", "new cover URL")
  .option("--username <username>", "new username")
  .action(
    async (
      action: string,
      options: {
        nickname?: string;
        description?: string;
        avatar?: string;
        cover?: string;
        username?: string;
      },
    ) => {
      const client = new RoteClient();
      if (action === "get") {
        const profile = await client.getProfile();
        console.log(JSON.stringify(profile, null, 2));
      } else if (action === "update") {
        const profile = await client.updateProfile({
          nickname: options.nickname,
          description: options.description,
          avatar: options.avatar,
          cover: options.cover,
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
  .option("--archived", "include archived notes")
  .option("-t, --tag <tags>", "comma-separated tags to filter by")
  .action(
    async (
      keyword: string,
      options: {
        limit: number;
        skip: number;
        archived?: boolean;
        tag?: string;
      },
    ) => {
      const client = new RoteClient();
      const tag = parseTags(options.tag);
      const notes = await client.searchNotes({
        keyword,
        limit: options.limit,
        skip: options.skip,
        archived: options.archived,
        tag: tag.length > 0 ? tag : undefined,
      });
      printNotes(notes);
    },
  );

program
  .command("list")
  .description("List recent notes")
  .option("-l, --limit <limit>", "max results", parseInt, 10)
  .option("-s, --skip <skip>", "offset", parseInt, 0)
  .option("--archived", "include archived notes")
  .option("-t, --tag <tags>", "comma-separated tags to filter by")
  .action(
    async (options: {
      limit: number;
      skip: number;
      archived?: boolean;
      tag?: string;
    }) => {
      const client = new RoteClient();
      const tag = parseTags(options.tag);
      const notes = await client.listNotes({
        limit: options.limit,
        skip: options.skip,
        archived: options.archived,
        tag: tag.length > 0 ? tag : undefined,
      });
      printNotes(notes);
    },
  );

program
  .command("explore")
  .description("List explore notes (no authentication required)")
  .option("-l, --limit <limit>", "max results", parseInt, 20)
  .option("-s, --skip <skip>", "offset", parseInt, 0)
  .action(
    async (options: {
      limit: number;
      skip: number;
    }) => {
      const client = new RoteClient();
      const notes = await client.exploreNotes({
        limit: options.limit,
        skip: options.skip,
      });
      printNotes(notes);
    },
  );

// --- New Extended OpenKey API Commands ---

program
  .command("articles")
  .description("List user articles")
  .option("-l, --limit <limit>", "max results", parseInt, 20)
  .option("-s, --skip <skip>", "offset", parseInt, 0)
  .option("-k, --keyword <keyword>", "search keyword")
  .action(
    async (options: {
      limit: number;
      skip: number;
      keyword?: string;
    }) => {
      const client = new RoteClient();
      const articles = await client.listArticles({
        limit: options.limit,
        skip: options.skip,
        keyword: options.keyword,
      });
      if (articles.length === 0) {
        console.log("No articles found.");
        return;
      }
      articles.forEach((article, i) => {
        console.log(
          `${i + 1}. [${article.id}] ${article.title || article.content.slice(0, 80)}`,
        );
      });
    },
  );

program
  .command("tags")
  .description("Get tag usage statistics")
  .action(async () => {
    const client = new RoteClient();
    const tags = await client.getTags();
    if (tags.length === 0) {
      console.log("No tags found.");
      return;
    }
    tags.forEach((t) => console.log(`${t.tag}: ${t.count}`));
  });

program
  .command("heatmap")
  .description("Get activity heatmap")
  .requiredOption("--start <date>", "start date (YYYY-MM-DD)")
  .requiredOption("--end <date>", "end date (YYYY-MM-DD)")
  .action(async (options: { start: string; end: string }) => {
    const client = new RoteClient();
    const heatmap = await client.getHeatmap({
      startDate: options.start,
      endDate: options.end,
    });
    if (heatmap.length === 0) {
      console.log("No activity in this range.");
      return;
    }
    heatmap.forEach((d) => console.log(`${d.date}: ${d.count} notes`));
  });

program
  .command("stats")
  .description("Get user statistics")
  .action(async () => {
    const client = new RoteClient();
    const stats = await client.getStatistics();
    console.log(`Notes: ${stats.noteCount}`);
    console.log(`Attachments: ${stats.attachmentCount}`);
  });

program
  .command("settings")
  .description("Get or update user settings")
  .argument("[action]", "action to perform (get|update)", "get")
  .option("--allow-explore <value>", "allow public notes in explore (true/false)")
  .action(
    async (
      action: string,
      options: {
        allowExplore?: string;
      },
    ) => {
      const client = new RoteClient();
      if (action === "get") {
        const settings = await client.getSettings();
        console.log(JSON.stringify(settings, null, 2));
      } else if (action === "update") {
        const allowExplore =
          options.allowExplore === "true"
            ? true
            : options.allowExplore === "false"
              ? false
              : undefined;
        const settings = await client.updateSettings({ allowExplore });
        console.log("Settings updated:");
        console.log(JSON.stringify(settings, null, 2));
      } else {
        console.error("Invalid action. Use 'get' or 'update'.");
      }
    },
  );

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
