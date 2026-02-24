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
      state: input.state ?? "private",
      type: input.type ?? "rote",
      pin: input.pin ?? false,
      ...(input.articleId ? { articleId: input.articleId } : {}),
    };

    return this.request<RoteNote>("/v2/api/openkey/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
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
