import { loadConfig } from "./config.js";
import type {
  AddReactionInput,
  ApiEnvelope,
  CreateArticleInput,
  CreateNoteInput,
  ListNotesInput,
  RemoveReactionInput,
  RemoveReactionResponse,
  RoteArticle,
  RoteNote,
  RotePermissions,
  RoteProfile,
  RoteReaction,
  SearchNotesInput,
  ToolkitConfig,
  UpdateNoteInput,
  UpdateProfileInput,
} from "./types.js";

export class RoteClient {
  private readonly apiUrl: string;
  private readonly openKey: string;

  constructor(config?: ToolkitConfig) {
    const resolved = config ?? loadConfig();
    this.apiUrl = resolved.apiUrl;
    this.openKey = resolved.openKey;
  }

  async createNote(input: CreateNoteInput): Promise<RoteNote> {
    if (!input.content?.trim()) {
      throw new Error("content is required");
    }

    const body = {
      openkey: this.openKey,
      content: input.content,
      title: input.title ?? "",
      tags: input.tags ?? [],
      state: input.isPublic ? "public" : "private",
      pin: input.pin ?? false,
      ...(input.articleId ? { articleId: input.articleId } : {}),
    };

    return this.request<RoteNote>("/v2/api/openkey/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async updateNote(input: UpdateNoteInput): Promise<RoteNote> {
    const noteId = input.noteId?.trim();
    if (!noteId) {
      throw new Error("noteId is required");
    }

    const hasUpdates =
      input.content !== undefined ||
      input.title !== undefined ||
      input.tags !== undefined ||
      input.isPublic !== undefined ||
      input.pin !== undefined ||
      input.archived !== undefined ||
      input.articleId !== undefined;
    if (!hasUpdates) {
      throw new Error("at least one field to update is required");
    }

    const body: Record<string, unknown> = {
      openkey: this.openKey,
    };
    if (input.content !== undefined) {
      body.content = input.content;
    }
    if (input.title !== undefined) {
      body.title = input.title;
    }
    if (input.tags !== undefined) {
      body.tags = input.tags;
    }
    if (input.isPublic !== undefined) {
      body.state = input.isPublic ? "public" : "private";
    }
    if (input.pin !== undefined) {
      body.pin = input.pin;
    }
    if (input.archived !== undefined) {
      body.archived = input.archived;
    }
    if (input.articleId !== undefined) {
      body.articleId = input.articleId;
    }

    return this.request<RoteNote>(
      `/v2/api/openkey/notes/${encodeURIComponent(noteId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  }

  async deleteNote(noteId: string): Promise<unknown> {
    const resolved = noteId?.trim();
    if (!resolved) {
      throw new Error("noteId is required");
    }

    const params = new URLSearchParams({ openkey: this.openKey });
    return this.request<unknown>(
      `/v2/api/openkey/notes/${encodeURIComponent(resolved)}?${params.toString()}`,
      { method: "DELETE" },
    );
  }

  async searchNotes(input: SearchNotesInput): Promise<RoteNote[]> {
    if (!input.keyword?.trim()) {
      throw new Error("keyword is required");
    }

    const params = new URLSearchParams({
      openkey: this.openKey,
      keyword: input.keyword,
      limit: String(input.limit ?? 10),
      skip: String(input.skip ?? 0),
    });
    if (input.archived !== undefined) {
      params.set("archived", String(input.archived));
    }
    if (input.tag) {
      input.tag.forEach((t) => params.append("tag", t));
    }

    return this.request<RoteNote[]>(
      `/v2/api/openkey/notes/search?${params.toString()}`,
    );
  }

  async listNotes(input: ListNotesInput = {}): Promise<RoteNote[]> {
    const params = new URLSearchParams({
      openkey: this.openKey,
      limit: String(input.limit ?? 10),
      skip: String(input.skip ?? 0),
    });
    if (input.archived !== undefined) {
      params.set("archived", String(input.archived));
    }
    if (input.tag) {
      input.tag.forEach((t) => params.append("tag", t));
    }

    return this.request<RoteNote[]>(
      `/v2/api/openkey/notes?${params.toString()}`,
    );
  }

  async createArticle(input: CreateArticleInput): Promise<RoteArticle> {
    if (!input.content?.trim()) {
      throw new Error("content is required");
    }

    const body = {
      openkey: this.openKey,
      content: input.content,
    };

    return this.request<RoteArticle>("/v2/api/openkey/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async addReaction(input: AddReactionInput): Promise<RoteReaction> {
    const body = {
      openkey: this.openKey,
      type: input.type,
      roteid: input.roteid,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    };

    return this.request<RoteReaction>("/v2/api/openkey/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async removeReaction(
    input: RemoveReactionInput,
  ): Promise<RemoveReactionResponse> {
    const params = new URLSearchParams({ openkey: this.openKey });
    return this.request<RemoveReactionResponse>(
      `/v2/api/openkey/reactions/${encodeURIComponent(input.roteid)}/${encodeURIComponent(input.type)}?${params.toString()}`,
      { method: "DELETE" },
    );
  }

  async getProfile(): Promise<RoteProfile> {
    const params = new URLSearchParams({ openkey: this.openKey });
    return this.request<RoteProfile>(
      `/v2/api/openkey/profile?${params.toString()}`,
    );
  }

  async updateProfile(input: UpdateProfileInput): Promise<RoteProfile> {
    const body = {
      openkey: this.openKey,
      ...input,
    };

    return this.request<RoteProfile>("/v2/api/openkey/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async getPermissions(): Promise<RotePermissions> {
    const params = new URLSearchParams({ openkey: this.openKey });
    return this.request<RotePermissions>(
      `/v2/api/openkey/permissions?${params.toString()}`,
    );
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.apiUrl}${path}`;
    const response = await fetch(url, init);
    const text = await response.text();

    let payload: ApiEnvelope<T> | null = null;
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      // keep null, handled below
    }

    if (!response.ok) {
      const message = payload?.message || text || `HTTP ${response.status}`;
      throw new Error(`Rote API request failed: ${message}`);
    }

    if (!payload) {
      throw new Error("Rote API returned non-JSON response.");
    }

    return payload.data;
  }
}
