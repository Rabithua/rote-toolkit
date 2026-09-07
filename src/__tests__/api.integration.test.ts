import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { RoteClient } from "../api.js";

/**
 * Integration tests against a real Rote API.
 *
 * Requires environment variables:
 * - ROTE_API_URL: The API base URL
 * - ROTE_OPENKEY: A valid OpenKey with full permissions
 *
 * Run with: npm run test:integration
 */

const API_URL = process.env.ROTE_API_URL;
const OPENKEY = process.env.ROTE_OPENKEY;

const skip = !API_URL || !OPENKEY;

describe.skipIf(skip)("RoteClient Integration Tests", () => {
  let client: RoteClient;
  let createdNoteId: string | null = null;
  let createdArticleId: string | null = null;

  beforeAll(() => {
    client = new RoteClient({
      apiUrl: API_URL!,
      openKey: OPENKEY!,
    });
  });

  afterAll(async () => {
    if (createdNoteId) {
      try {
        await client.deleteNote(createdNoteId);
      } catch {
        // Ignore cleanup errors
      }
    }
    if (createdArticleId) {
      try {
        await client.deleteArticle(createdArticleId);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe("Notes CRUD", () => {
    it("should create a note", async () => {
      const timestamp = Date.now();
      const note = await client.createNote({
        content: `Integration test note - ${timestamp}`,
        title: "Test Note",
        tags: ["test", "integration"],
        isPublic: false,
        pin: false,
      });

      expect(note).toBeDefined();
      expect(note.id).toBeDefined();
      expect(note.content).toContain("Integration test note");

      createdNoteId = note.id;
    });

    it("should update a note", async () => {
      expect(createdNoteId).not.toBeNull();

      const current = await client.getNote(createdNoteId!);
      expect(current.id).toBe(createdNoteId);

      const updated = await client.updateNote({
        noteId: createdNoteId!,
        title: "Updated Test Note",
        tags: ["test", "integration", "updated"],
      });

      expect(updated).toBeDefined();
      expect(updated.id).toBe(createdNoteId);
    });

    it("should search notes", async () => {
      const notes = await client.searchNotes({
        keyword: "Integration test",
        limit: 10,
      });

      expect(Array.isArray(notes)).toBe(true);
    });

    it("should list notes", async () => {
      const notes = await client.listNotes({
        limit: 10,
        skip: 0,
      });

      expect(Array.isArray(notes)).toBe(true);
    });

    it("should delete a note", async () => {
      expect(createdNoteId).not.toBeNull();

      await client.deleteNote(createdNoteId!);

      // Mark as deleted so afterAll doesn't try again
      createdNoteId = null;
    });
  });

  describe("Explore Notes (Public)", () => {
    it("should get explore notes without auth issues", async () => {
      const notes = await client.exploreNotes({
        limit: 5,
      });

      expect(Array.isArray(notes)).toBe(true);
    });
  });

  describe("Articles", () => {
    it("should create an article", async () => {
      const timestamp = Date.now();
      const article = await client.createArticle({
        content: `# Integration Test Article\n\nCreated at ${timestamp}`,
      });

      expect(article).toBeDefined();
      expect(article.id).toBeDefined();
      createdArticleId = article.id;
    });

    it("should list articles", async () => {
      const articles = await client.listArticles({
        limit: 10,
      });

      expect(Array.isArray(articles)).toBe(true);
    });

    it("should get, update, and delete an article", async () => {
      expect(createdArticleId).not.toBeNull();

      const current = await client.getArticle(createdArticleId!);
      expect(current.id).toBe(createdArticleId);

      const updated = await client.updateArticle({
        articleId: createdArticleId!,
        content: "# Updated integration article",
      });
      expect(updated.content).toContain("Updated integration article");

      const deleted = await client.deleteArticle(createdArticleId!);
      expect(deleted.id).toBe(createdArticleId);
      createdArticleId = null;
    });
  });

  describe("Note shares", () => {
    it("should create, read anonymously, and revoke a share link", async () => {
      const note = await client.createNote({
        content: `Share integration note - ${Date.now()}`,
        isPublic: false,
      });

      try {
        expect(await client.getNoteShareState(note.id)).toEqual({ active: false });

        const created = await client.createResolvedNoteShare(note.id);
        expect(created.url).toContain(`/s/${created.token}`);

        const anonymous = await fetch(
          `${API_URL!.replace(/\/$/, "")}/v2/api/shares/${encodeURIComponent(created.token)}`,
        );
        expect(anonymous.status).toBe(200);

        await client.revokeNoteShare(note.id);
        expect(await client.getNoteShareState(note.id)).toEqual({ active: false });
        expect(
          await fetch(
            `${API_URL!.replace(/\/$/, "")}/v2/api/shares/${encodeURIComponent(created.token)}`,
          ),
        ).toHaveProperty("status", 404);
      } finally {
        await client.deleteNote(note.id);
      }
    });
  });

  describe("Profile & Permissions", () => {
    it("should get profile", async () => {
      const profile = await client.getProfile();

      expect(profile).toBeDefined();
      expect(profile.id).toBeDefined();
      expect(profile.username).toBeDefined();
    });

    it("should get permissions", async () => {
      const permissions = await client.getPermissions();

      expect(permissions).toBeDefined();
      expect(Array.isArray(permissions.permissions)).toBe(true);
      expect(permissions.permissions.length).toBeGreaterThan(0);
    });
  });

  describe("Tags & Statistics", () => {
    it("should get tags", async () => {
      const tags = await client.getTags();

      expect(Array.isArray(tags)).toBe(true);
    });

    it("should get statistics", async () => {
      const stats = await client.getStatistics();

      expect(stats).toBeDefined();
      // Support both roteCount (new) and noteCount (legacy) during transition
      const roteCount =
        stats.roteCount ?? (stats as unknown as Record<string, unknown>).noteCount;
      expect(typeof roteCount).toBe("number");
    });

    it("should get heatmap", async () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 1);

      const heatmap = await client.getHeatmap({
        startDate: startDate.toISOString().slice(0, 10),
        endDate: today.toISOString().slice(0, 10),
      });

      // Heatmap may be an array or an object with data
      expect(heatmap).toBeDefined();
      if (Array.isArray(heatmap)) {
        expect(Array.isArray(heatmap)).toBe(true);
      } else {
        expect(typeof heatmap).toBe("object");
      }
    });
  });

  describe("Settings", () => {
    it("should get settings", async () => {
      const settings = await client.getSettings();

      expect(settings).toBeDefined();
    });
  });

  describe("Batch Operations", () => {
    it("should batch get notes with valid IDs", async () => {
      // First create a note to get a valid ID
      const note = await client.createNote({
        content: `Batch test note - ${Date.now()}`,
      });

      try {
        const notes = await client.batchGetNotes({
          ids: [note.id],
        });

        expect(Array.isArray(notes)).toBe(true);
        expect(notes.length).toBeGreaterThan(0);
      } finally {
        // Cleanup
        await client.deleteNote(note.id);
      }
    });
  });

  describe("Reactions", () => {
    let testNoteId: string | null = null;

    beforeAll(async () => {
      // Create a test note for reaction tests
      const note = await client.createNote({
        content: `Reaction test note - ${Date.now()}`,
        isPublic: false,
      });
      testNoteId = note.id;
    });

    afterAll(async () => {
      if (testNoteId) {
        try {
          await client.deleteNote(testNoteId);
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    it("should add a reaction", async () => {
      expect(testNoteId).not.toBeNull();

      const reaction = await client.addReaction({
        roteid: testNoteId!,
        type: "like",
      });

      expect(reaction).toBeDefined();
      expect(reaction.type).toBe("like");
    });

    it("should remove a reaction", async () => {
      expect(testNoteId).not.toBeNull();

      const result = await client.removeReaction({
        roteid: testNoteId!,
        type: "like",
      });

      expect(result).toBeDefined();
      expect(typeof result.count).toBe("number");
    });
  });
});
