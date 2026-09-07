import { loadConfig } from "./config.js";
import type {
  AddReactionInput,
  ApiEnvelope,
  BatchDeleteAttachmentsInput,
  BatchDeleteAttachmentsResponse,
  BatchGetNotesInput,
  CreateArticleInput,
  CreateNoteInput,
  ExploreNotesInput,
  FinalizeAttachmentUploadsInput,
  GetHeatmapInput,
  HeatmapDay,
  ListArticlesInput,
  ListNotesInput,
  RemoveReactionInput,
  RemoveReactionResponse,
  NoteShareLink,
  NoteShareState,
  PresignAttachmentUploadsInput,
  PresignAttachmentUploadsResponse,
  ResolvedNoteShareLink,
  RoteArticle,
  RoteArticleDetails,
  RoteAttachment,
  RoteArticleWithMeta,
  RoteNote,
  RotePermissions,
  RoteProfile,
  RoteReaction,
  RoteSettings,
  RoteStatistics,
  RoteTag,
  SearchNotesInput,
  ToolkitConfig,
  UpdateAttachmentsSortOrderInput,
  UpdateArticleInput,
  UpdateNoteInput,
  UpdateProfileInput,
  UpdateSettingsInput,
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

  async getNote(noteId: string): Promise<RoteNote> {
    const resolved = this.requireId(noteId, "noteId");
    const params = new URLSearchParams({ openkey: this.openKey });
    return this.request<RoteNote>(
      `/v2/api/openkey/notes/${encodeURIComponent(resolved)}?${params.toString()}`,
    );
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

  async exploreNotes(input: ExploreNotesInput = {}): Promise<RoteNote[]> {
    const params = new URLSearchParams({
      limit: String(input.limit ?? 20),
      skip: String(input.skip ?? 0),
    });

    return this.request<RoteNote[]>(
      `/v2/api/notes/public?${params.toString()}`,
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

  async getArticle(articleId: string): Promise<RoteArticleDetails> {
    const resolved = this.requireId(articleId, "articleId");
    const params = new URLSearchParams({ openkey: this.openKey });
    return this.request<RoteArticleDetails>(
      `/v2/api/openkey/articles/${encodeURIComponent(resolved)}?${params.toString()}`,
    );
  }

  async updateArticle(input: UpdateArticleInput): Promise<RoteArticle> {
    const articleId = this.requireId(input.articleId, "articleId");
    if (input.content === undefined) {
      throw new Error("content is required");
    }
    return this.request<RoteArticle>(
      `/v2/api/openkey/articles/${encodeURIComponent(articleId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openkey: this.openKey, content: input.content }),
      },
    );
  }

  async deleteArticle(articleId: string): Promise<RoteArticle> {
    const resolved = this.requireId(articleId, "articleId");
    const params = new URLSearchParams({ openkey: this.openKey });
    return this.request<RoteArticle>(
      `/v2/api/openkey/articles/${encodeURIComponent(resolved)}?${params.toString()}`,
      { method: "DELETE" },
    );
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

  // --- New Extended OpenKey API Methods ---

  async listArticles(
    input: ListArticlesInput = {},
  ): Promise<RoteArticleWithMeta[]> {
    const params = new URLSearchParams({
      openkey: this.openKey,
    });
    if (input.limit !== undefined) {
      params.set("limit", String(input.limit));
    }
    if (input.skip !== undefined) {
      params.set("skip", String(input.skip));
    }
    if (input.keyword) {
      params.set("keyword", input.keyword);
    }

    return this.request<RoteArticleWithMeta[]>(
      `/v2/api/openkey/articles?${params.toString()}`,
    );
  }

  async getArticleByNoteId(noteId: string): Promise<RoteArticle | null> {
    const resolved = noteId?.trim();
    if (!resolved) {
      throw new Error("noteId is required");
    }

    const params = new URLSearchParams({ openkey: this.openKey });
    return this.request<RoteArticle | null>(
      `/v2/api/openkey/articles/by-note/${encodeURIComponent(resolved)}?${params.toString()}`,
    );
  }

  async batchGetNotes(input: BatchGetNotesInput): Promise<RoteNote[]> {
    if (!input.ids?.length) {
      throw new Error("ids array is required");
    }
    if (input.ids.length > 100) {
      throw new Error("Maximum 100 IDs allowed");
    }

    const body = {
      openkey: this.openKey,
      ids: input.ids,
    };

    return this.request<RoteNote[]>("/v2/api/openkey/notes/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async getTags(): Promise<RoteTag[]> {
    const params = new URLSearchParams({ openkey: this.openKey });
    return this.request<RoteTag[]>(
      `/v2/api/openkey/tags?${params.toString()}`,
    );
  }

  async getHeatmap(input: GetHeatmapInput): Promise<HeatmapDay[]> {
    if (!input.startDate || !input.endDate) {
      throw new Error("startDate and endDate are required");
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.startDate) || !dateRegex.test(input.endDate)) {
      throw new Error("Invalid date format. Use YYYY-MM-DD");
    }

    const params = new URLSearchParams({
      openkey: this.openKey,
      startDate: input.startDate,
      endDate: input.endDate,
    });

    return this.request<HeatmapDay[]>(
      `/v2/api/openkey/heatmap?${params.toString()}`,
    );
  }

  async getStatistics(): Promise<RoteStatistics> {
    const params = new URLSearchParams({ openkey: this.openKey });
    return this.request<RoteStatistics>(
      `/v2/api/openkey/statistics?${params.toString()}`,
    );
  }

  async getSettings(): Promise<RoteSettings> {
    const params = new URLSearchParams({ openkey: this.openKey });
    return this.request<RoteSettings>(
      `/v2/api/openkey/settings?${params.toString()}`,
    );
  }

  async updateSettings(input: UpdateSettingsInput): Promise<RoteSettings> {
    const body = {
      openkey: this.openKey,
      ...input,
    };

    return this.request<RoteSettings>("/v2/api/openkey/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async batchDeleteAttachments(
    input: BatchDeleteAttachmentsInput,
  ): Promise<BatchDeleteAttachmentsResponse> {
    if (!input.ids?.length) {
      throw new Error("ids array is required");
    }
    if (input.ids.length > 100) {
      throw new Error("Maximum 100 IDs allowed");
    }

    const body = {
      openkey: this.openKey,
      ids: input.ids,
    };

    return this.request<BatchDeleteAttachmentsResponse>(
      "/v2/api/openkey/attachments",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  }

  async deleteAttachment(attachmentId: string): Promise<BatchDeleteAttachmentsResponse> {
    const resolved = this.requireId(attachmentId, "attachmentId");
    const params = new URLSearchParams({ openkey: this.openKey });
    return this.request<BatchDeleteAttachmentsResponse>(
      `/v2/api/openkey/attachments/${encodeURIComponent(resolved)}?${params.toString()}`,
      { method: "DELETE" },
    );
  }

  async presignAttachmentUploads(
    input: PresignAttachmentUploadsInput,
  ): Promise<PresignAttachmentUploadsResponse> {
    if (!input.files?.length) {
      throw new Error("files array is required");
    }
    if (input.files.length > 9) {
      throw new Error("Maximum 9 files allowed");
    }
    for (const file of input.files) {
      if (!file.contentType?.trim()) throw new Error("contentType is required");
      if (!Number.isSafeInteger(file.size) || file.size <= 0) {
        throw new Error("file size must be a positive integer");
      }
    }
    return this.request<PresignAttachmentUploadsResponse>(
      "/v2/api/openkey/attachments/presign",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openkey: this.openKey, files: input.files }),
      },
    );
  }

  async refreshAttachmentUploadReservation(
    reservationId: string,
  ): Promise<PresignAttachmentUploadsResponse> {
    const resolved = this.requireId(reservationId, "reservationId");
    return this.request<PresignAttachmentUploadsResponse>(
      `/v2/api/openkey/attachments/reservations/${encodeURIComponent(resolved)}/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openkey: this.openKey }),
      },
    );
  }

  async finalizeAttachmentUploads(
    input: FinalizeAttachmentUploadsInput,
  ): Promise<RoteAttachment[]> {
    if (!input.attachments?.length) {
      throw new Error("attachments array is required");
    }
    return this.request<RoteAttachment[]>("/v2/api/openkey/attachments/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openkey: this.openKey,
        attachments: input.attachments,
        ...(input.noteId ? { noteId: input.noteId } : {}),
      }),
    });
  }

  async updateAttachmentsSortOrder(
    input: UpdateAttachmentsSortOrderInput,
  ): Promise<unknown> {
    if (!input.noteId?.trim()) {
      throw new Error("noteId is required");
    }
    if (!input.attachmentIds?.length) {
      throw new Error("attachmentIds array is required");
    }

    const body = {
      openkey: this.openKey,
      noteId: input.noteId,
      attachmentIds: input.attachmentIds,
    };

    return this.request<unknown>("/v2/api/openkey/attachments/sort", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async getNoteShare(noteId: string): Promise<NoteShareLink | null> {
    return this.noteShareRequest<NoteShareLink | null>(noteId, "GET");
  }

  async createNoteShare(noteId: string): Promise<NoteShareLink> {
    return this.noteShareRequest<NoteShareLink>(noteId, "PUT");
  }

  async revokeNoteShare(noteId: string): Promise<void> {
    await this.noteShareRequest<null>(noteId, "DELETE");
  }

  async getNoteShareState(noteId: string): Promise<NoteShareState> {
    const share = await this.getNoteShare(noteId);
    if (!share) return { active: false };
    const origin = await this.getShareFrontendOrigin();
    return {
      active: true,
      token: share.token,
      createdAt: share.createdAt,
      url: origin ? `${origin}/s/${encodeURIComponent(share.token)}` : null,
    };
  }

  async createResolvedNoteShare(noteId: string): Promise<ResolvedNoteShareLink> {
    const origin = await this.getShareFrontendOrigin();
    if (!origin) throw new Error("Rote frontend URL is unavailable");
    const share = await this.createNoteShare(noteId);
    return {
      ...share,
      url: `${origin}/s/${encodeURIComponent(share.token)}`,
    };
  }

  async resolveNoteShareUrl(token: string): Promise<string> {
    const resolved = this.requireId(token, "share token");
    const origin = await this.getShareFrontendOrigin();
    if (!origin) throw new Error("Rote frontend URL is unavailable");
    return `${origin}/s/${encodeURIComponent(resolved)}`;
  }

  async getShareFrontendOrigin(): Promise<string | null> {
    const status = await this.request<{ site?: { frontendUrl?: string } }>("/v2/api/site/status");
    const configured = status.site?.frontendUrl;
    if (typeof configured !== "string" || configured.trim().length === 0) return null;
    try {
      const url = new URL(configured.trim());
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      ) {
        return null;
      }
      return url.origin;
    } catch {
      return null;
    }
  }

  private async noteShareRequest<T>(
    noteId: string,
    method: "GET" | "PUT" | "DELETE",
  ): Promise<T> {
    const resolved = this.requireId(noteId, "noteId");
    const path = `/v2/api/openkey/notes/${encodeURIComponent(resolved)}/share`;
    if (method === "GET" || method === "DELETE") {
      const params = new URLSearchParams({ openkey: this.openKey });
      return this.request<T>(`${path}?${params.toString()}`, { method });
    }
    return this.request<T>(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openkey: this.openKey }),
    });
  }

  private requireId(value: string, label: string): string {
    const resolved = value?.trim();
    if (!resolved) throw new Error(`${label} is required`);
    return resolved;
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
