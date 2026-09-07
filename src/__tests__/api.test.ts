import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RoteClient } from "../api.js";

// Mock config
vi.mock("../config.js", () => ({
  loadConfig: () => ({
    apiUrl: "https://api.test.com",
    openKey: "test-key-123",
  }),
}));

describe("RoteClient", () => {
  let client: RoteClient;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    client = new RoteClient();
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockResponse = <T>(data: T) => {
    return new Response(JSON.stringify({ code: 0, message: "ok", data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const mockErrorResponse = (message: string, status = 400) => {
    return new Response(JSON.stringify({ code: 1, message, data: null }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };

  describe("createNote", () => {
    it("should create a note with required content", async () => {
      const mockNote = { id: "note-1", content: "Test note" };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockNote));

      const result = await client.createNote({ content: "Test note" });

      expect(result).toEqual(mockNote);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.test.com/v2/api/openkey/notes",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );

      const body = JSON.parse(
        (fetchSpy.mock.calls[0][1] as RequestInit).body as string
      );
      expect(body.openkey).toBe("test-key-123");
      expect(body.content).toBe("Test note");
      expect(body.state).toBe("private");
    });

    it("should create a public note with tags", async () => {
      const mockNote = {
        id: "note-2",
        content: "Public note",
        tags: ["tag1", "tag2"],
      };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockNote));

      await client.createNote({
        content: "Public note",
        tags: ["tag1", "tag2"],
        isPublic: true,
        pin: true,
      });

      const body = JSON.parse(
        (fetchSpy.mock.calls[0][1] as RequestInit).body as string
      );
      expect(body.state).toBe("public");
      expect(body.tags).toEqual(["tag1", "tag2"]);
      expect(body.pin).toBe(true);
    });

    it("should throw error when content is empty", async () => {
      await expect(client.createNote({ content: "" })).rejects.toThrow(
        "content is required"
      );
      await expect(client.createNote({ content: "   " })).rejects.toThrow(
        "content is required"
      );
    });
  });

  describe("updateNote", () => {
    it("should update a note", async () => {
      const mockNote = { id: "note-1", content: "Updated", title: "New Title" };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockNote));

      const result = await client.updateNote({
        noteId: "note-1",
        title: "New Title",
      });

      expect(result).toEqual(mockNote);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.test.com/v2/api/openkey/notes/note-1",
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("should throw error when noteId is empty", async () => {
      await expect(client.updateNote({ noteId: "" })).rejects.toThrow(
        "noteId is required"
      );
    });

    it("should throw error when no fields to update", async () => {
      await expect(client.updateNote({ noteId: "note-1" })).rejects.toThrow(
        "at least one field to update is required"
      );
    });
  });

  describe("getNote", () => {
    it("should get a note by ID", async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ id: "note-1", content: "Test" }));

      await client.getNote("note-1");

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.test.com/v2/api/openkey/notes/note-1?openkey=test-key-123",
        undefined
      );
    });
  });

  describe("deleteNote", () => {
    it("should delete a note", async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({}));

      await client.deleteNote("note-1");

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.test.com/v2/api/openkey/notes/note-1?openkey=test-key-123",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should throw error when noteId is empty", async () => {
      await expect(client.deleteNote("")).rejects.toThrow("noteId is required");
    });
  });

  describe("searchNotes", () => {
    it("should search notes with keyword", async () => {
      const mockNotes = [{ id: "note-1", content: "Test" }];
      fetchSpy.mockResolvedValueOnce(mockResponse(mockNotes));

      const result = await client.searchNotes({ keyword: "test" });

      expect(result).toEqual(mockNotes);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/v2/api/openkey/notes/search?"),
        undefined
      );
      expect(fetchSpy.mock.calls[0][0]).toContain("keyword=test");
      expect(fetchSpy.mock.calls[0][0]).toContain("openkey=test-key-123");
    });

    it("should include tag filters", async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse([]));

      await client.searchNotes({
        keyword: "test",
        tag: ["ai", "notes"],
        archived: true,
      });

      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain("tag=ai");
      expect(url).toContain("tag=notes");
      expect(url).toContain("archived=true");
    });

    it("should throw error when keyword is empty", async () => {
      await expect(client.searchNotes({ keyword: "" })).rejects.toThrow(
        "keyword is required"
      );
    });
  });

  describe("listNotes", () => {
    it("should list notes with pagination", async () => {
      const mockNotes = [{ id: "note-1", content: "Test" }];
      fetchSpy.mockResolvedValueOnce(mockResponse(mockNotes));

      const result = await client.listNotes({ limit: 20, skip: 10 });

      expect(result).toEqual(mockNotes);
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain("limit=20");
      expect(url).toContain("skip=10");
    });
  });

  describe("exploreNotes", () => {
    it("should get explore notes without auth in URL path", async () => {
      const mockNotes = [{ id: "note-1", content: "Public" }];
      fetchSpy.mockResolvedValueOnce(mockResponse(mockNotes));

      const result = await client.exploreNotes({ limit: 20 });

      expect(result).toEqual(mockNotes);
      expect(fetchSpy.mock.calls[0][0]).toContain("/v2/api/notes/public?");
      expect(fetchSpy.mock.calls[0][0]).not.toContain("openkey");
    });
  });

  describe("createArticle", () => {
    it("should create an article", async () => {
      const mockArticle = { id: "article-1", content: "# Title" };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockArticle));

      const result = await client.createArticle({ content: "# Title" });

      expect(result).toEqual(mockArticle);
    });

    it("should throw error when content is empty", async () => {
      await expect(client.createArticle({ content: "" })).rejects.toThrow(
        "content is required"
      );
    });
  });

  describe("listArticles", () => {
    it("should list articles with pagination", async () => {
      const mockArticles = [{ id: "article-1", content: "# Title" }];
      fetchSpy.mockResolvedValueOnce(mockResponse(mockArticles));

      const result = await client.listArticles({ limit: 20, skip: 0 });

      expect(result).toEqual(mockArticles);
    });
  });

  describe("article management", () => {
    it("should get, update, and delete an article", async () => {
      const article = { id: "article-1", content: "Article" };
      fetchSpy
        .mockResolvedValueOnce(mockResponse(article))
        .mockResolvedValueOnce(mockResponse({ ...article, content: "Updated" }))
        .mockResolvedValueOnce(mockResponse(article));

      await client.getArticle(article.id);
      await client.updateArticle({ articleId: article.id, content: "Updated" });
      await client.deleteArticle(article.id);

      expect(fetchSpy.mock.calls[0][0]).toBe(
        "https://api.test.com/v2/api/openkey/articles/article-1?openkey=test-key-123"
      );
      expect(fetchSpy.mock.calls[1][1]).toEqual(
        expect.objectContaining({ method: "PUT" })
      );
      expect(fetchSpy.mock.calls[2][1]).toEqual(
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("batchGetNotes", () => {
    it("should batch get notes", async () => {
      const mockNotes = [
        { id: "note-1", content: "Test 1" },
        { id: "note-2", content: "Test 2" },
      ];
      fetchSpy.mockResolvedValueOnce(mockResponse(mockNotes));

      const result = await client.batchGetNotes({ ids: ["note-1", "note-2"] });

      expect(result).toEqual(mockNotes);
    });

    it("should throw error when ids is empty", async () => {
      await expect(client.batchGetNotes({ ids: [] })).rejects.toThrow(
        "ids array is required"
      );
    });

    it("should throw error when ids exceeds 100", async () => {
      const ids = Array.from({ length: 101 }, (_, i) => `note-${i}`);
      await expect(client.batchGetNotes({ ids })).rejects.toThrow(
        "Maximum 100 IDs allowed"
      );
    });
  });

  describe("reactions", () => {
    it("should add a reaction", async () => {
      const mockReaction = { id: "reaction-1", type: "like", roteid: "note-1" };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockReaction));

      const result = await client.addReaction({
        roteid: "note-1",
        type: "like",
      });

      expect(result).toEqual(mockReaction);
    });

    it("should remove a reaction", async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ count: 1 }));

      const result = await client.removeReaction({
        roteid: "note-1",
        type: "like",
      });

      expect(result.count).toBe(1);
    });
  });

  describe("profile", () => {
    it("should get profile", async () => {
      const mockProfile = { id: "user-1", username: "test" };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockProfile));

      const result = await client.getProfile();

      expect(result).toEqual(mockProfile);
    });

    it("should update profile", async () => {
      const mockProfile = { id: "user-1", username: "test", nickname: "New" };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockProfile));

      const result = await client.updateProfile({ nickname: "New" });

      expect(result).toEqual(mockProfile);
    });
  });

  describe("permissions", () => {
    it("should get permissions", async () => {
      const mockPermissions = { permissions: ["SENDROTE", "GETROTE"] };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockPermissions));

      const result = await client.getPermissions();

      expect(result.permissions).toEqual(["SENDROTE", "GETROTE"]);
    });
  });

  describe("tags", () => {
    it("should get tags", async () => {
      const mockTags = [
        { tag: "ai", count: 10 },
        { tag: "notes", count: 5 },
      ];
      fetchSpy.mockResolvedValueOnce(mockResponse(mockTags));

      const result = await client.getTags();

      expect(result).toEqual(mockTags);
    });
  });

  describe("heatmap", () => {
    it("should get heatmap", async () => {
      const mockHeatmap = [
        { date: "2024-01-01", count: 5 },
        { date: "2024-01-02", count: 3 },
      ];
      fetchSpy.mockResolvedValueOnce(mockResponse(mockHeatmap));

      const result = await client.getHeatmap({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result).toEqual(mockHeatmap);
    });

    it("should throw error when dates are missing", async () => {
      await expect(
        client.getHeatmap({ startDate: "", endDate: "2024-01-31" })
      ).rejects.toThrow("startDate and endDate are required");
    });

    it("should throw error for invalid date format", async () => {
      await expect(
        client.getHeatmap({ startDate: "2024/01/01", endDate: "2024-01-31" })
      ).rejects.toThrow("Invalid date format");
    });
  });

  describe("statistics", () => {
    it("should get statistics", async () => {
      const mockStats = { roteCount: 100, attachmentCount: 50 };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockStats));

      const result = await client.getStatistics();

      expect(result).toEqual(mockStats);
    });
  });

  describe("settings", () => {
    it("should get settings", async () => {
      const mockSettings = { allowExplore: true };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockSettings));

      const result = await client.getSettings();

      expect(result).toEqual(mockSettings);
    });

    it("should update settings", async () => {
      const mockSettings = { allowExplore: false };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockSettings));

      const result = await client.updateSettings({ allowExplore: false });

      expect(result).toEqual(mockSettings);
    });
  });

  describe("attachments", () => {
    it("should delete one attachment", async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ count: 1 }));

      expect(await client.deleteAttachment("att-1")).toEqual({ count: 1 });

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.test.com/v2/api/openkey/attachments/att-1?openkey=test-key-123",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should presign, refresh, and finalize attachment uploads", async () => {
      const manifest = {
        items: [
          {
            uuid: "upload-1",
            original: {
              key: "users/test/uploads/upload-1.jpg",
              putUrl: "https://upload/1",
              url: "https://files/1",
              contentType: "image/jpeg",
            },
          },
        ],
        reservationId: "reservation-1",
        expiresAt: "2026-09-07T00:00:00.000Z",
      };
      fetchSpy
        .mockResolvedValueOnce(mockResponse(manifest))
        .mockResolvedValueOnce(mockResponse(manifest))
        .mockResolvedValueOnce(mockResponse([{ id: "att-1", url: "https://files/1" }]));

      await client.presignAttachmentUploads({
        files: [{ filename: "photo.jpg", contentType: "image/jpeg", size: 4 }],
      });
      await client.refreshAttachmentUploadReservation("reservation-1");
      await client.finalizeAttachmentUploads({
        noteId: "note-1",
        attachments: [
          {
            uuid: "upload-1",
            originalKey: "users/test/uploads/upload-1.jpg",
            mimetype: "image/jpeg",
            size: 4,
          },
        ],
      });

      expect(fetchSpy.mock.calls[0][0]).toBe(
        "https://api.test.com/v2/api/openkey/attachments/presign"
      );
      expect(fetchSpy.mock.calls[1][0]).toContain(
        "/attachments/reservations/reservation-1/refresh"
      );
      expect(fetchSpy.mock.calls[2][0]).toBe(
        "https://api.test.com/v2/api/openkey/attachments/finalize"
      );
    });

    it("should batch delete attachments", async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ count: 2 }));

      const result = await client.batchDeleteAttachments({
        ids: ["att-1", "att-2"],
      });

      expect(result).toEqual({ count: 2 });
    });

    it("should throw error when ids is empty", async () => {
      await expect(client.batchDeleteAttachments({ ids: [] })).rejects.toThrow(
        "ids array is required"
      );
    });

    it("should update attachments sort order", async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({}));

      await client.updateAttachmentsSortOrder({
        noteId: "note-1",
        attachmentIds: ["att-1", "att-2"],
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.test.com/v2/api/openkey/attachments/sort",
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("should throw error when noteId is empty", async () => {
      await expect(
        client.updateAttachmentsSortOrder({
          noteId: "",
          attachmentIds: ["att-1"],
        })
      ).rejects.toThrow("noteId is required");
    });
  });

  describe("note shares", () => {
    const share = { token: "share-token", createdAt: "2026-09-07T00:00:00.000Z" };

    it("should get and revoke a note share through OpenKey", async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(share)).mockResolvedValueOnce(mockResponse(null));

      expect(await client.getNoteShare("note-1")).toEqual(share);
      await client.revokeNoteShare("note-1");

      expect(fetchSpy.mock.calls[0][0]).toContain("/openkey/notes/note-1/share?openkey=");
      expect(fetchSpy.mock.calls[1][1]).toEqual(expect.objectContaining({ method: "DELETE" }));
    });

    it("should resolve the configured self-hosted frontend before creating", async () => {
      fetchSpy
        .mockResolvedValueOnce(
          mockResponse({ site: { frontendUrl: "http://localhost:4321/" } })
        )
        .mockResolvedValueOnce(mockResponse(share));

      const resolved = await client.createResolvedNoteShare("note-1");

      expect(resolved.url).toBe("http://localhost:4321/s/share-token");
      expect(fetchSpy.mock.calls[0][0]).toBe("https://api.test.com/v2/api/site/status");
      expect(fetchSpy.mock.calls[1][1]).toEqual(expect.objectContaining({ method: "PUT" }));
    });

    it("should not create when the frontend URL is invalid", async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ site: { frontendUrl: "not-a-url" } }));

      await expect(client.createResolvedNoteShare("note-1")).rejects.toThrow(
        "Rote frontend URL is unavailable"
      );
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("should reject a configured URL that is not an origin", async () => {
      fetchSpy.mockResolvedValueOnce(
        mockResponse({ site: { frontendUrl: "https://notes.example.test/base" } })
      );

      await expect(client.createResolvedNoteShare("note-1")).rejects.toThrow(
        "Rote frontend URL is unavailable"
      );
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("should present an active share with a null URL when frontend config is unavailable", async () => {
      fetchSpy
        .mockResolvedValueOnce(mockResponse(share))
        .mockResolvedValueOnce(mockResponse({ site: { frontendUrl: "" } }));

      expect(await client.getNoteShareState("note-1")).toEqual({
        active: true,
        ...share,
        url: null,
      });
    });
  });

  describe("error handling", () => {
    it("should throw error on API failure", async () => {
      fetchSpy.mockResolvedValueOnce(mockErrorResponse("Invalid request", 400));

      await expect(client.listNotes()).rejects.toThrow(
        "Rote API request failed: Invalid request"
      );
    });

    it("should throw error on non-JSON response", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response("Not JSON", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        })
      );

      await expect(client.listNotes()).rejects.toThrow(
        "Rote API returned non-JSON response"
      );
    });
  });
});
