export interface ToolkitConfig {
  apiUrl: string;
  openKey: string;
}

export interface RoteNote {
  id: string;
  content: string;
  title?: string;
  tags?: string[];
  state?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

export interface CreateNoteInput {
  content: string;
  title?: string;
  tags?: string[];
  isPublic?: boolean;
  pin?: boolean;
  articleId?: string;
}

export interface UpdateNoteInput {
  noteId: string;
  content?: string;
  title?: string;
  tags?: string[];
  isPublic?: boolean;
  pin?: boolean;
  archived?: boolean;
  articleId?: string;
}

export interface RoteArticle {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleInput {
  content: string;
}

export interface UpdateArticleInput {
  articleId: string;
  content: string;
}

export interface RoteArticleDetails extends RoteArticle {
  note?: RoteNote | null;
}

export interface RoteReaction {
  id: string;
  type: string;
  roteid: string;
  userid: string;
}

export interface AddReactionInput {
  type: string;
  roteid: string;
  /**
   * Optional metadata attached to the reaction.
   * Used to record the source channel and any extra context.
   * Example: { source: 'web' }, { source: 'cli' }, { source: 'mcp' }
   */
  metadata?: Record<string, unknown>;
}

export interface RemoveReactionInput {
  type: string;
  roteid: string;
}

export interface RemoveReactionResponse {
  count: number;
}

export interface RoteProfile {
  id: string;
  email: string;
  emailVerified?: boolean;
  username: string;
  nickname: string;
  description: string;
  avatar: string;
  cover: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  allowExplore?: boolean;
  oauthBindings?: unknown[];
}

export interface UpdateProfileInput {
  nickname?: string;
  description?: string;
  avatar?: string;
  cover?: string;
  username?: string;
}

export interface RotePermissions {
  permissions: string[];
}

export interface SearchNotesInput {
  keyword: string;
  limit?: number;
  skip?: number;
  archived?: boolean;
  tag?: string[];
}

export interface ListNotesInput {
  limit?: number;
  skip?: number;
  archived?: boolean;
  tag?: string[];
}

export interface ExploreNotesInput {
  limit?: number;
  skip?: number;
}

// New types for extended OpenKey API

export interface ListArticlesInput {
  limit?: number;
  skip?: number;
  keyword?: string;
}

export interface RoteArticleWithMeta extends RoteArticle {
  title?: string;
  summary?: string;
}

export interface BatchGetNotesInput {
  ids: string[];
}

export interface RoteTag {
  tag: string;
  count: number;
}

export interface GetHeatmapInput {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface RoteStatistics {
  roteCount: number;
  attachmentCount: number;
}

export interface RoteSettings {
  allowExplore?: boolean;
  [key: string]: unknown;
}

export interface UpdateSettingsInput {
  allowExplore?: boolean;
  [key: string]: unknown;
}

export interface BatchDeleteAttachmentsInput {
  ids: string[];
}

export interface BatchDeleteAttachmentsResponse {
  count: number;
}

export interface UpdateAttachmentsSortOrderInput {
  noteId: string;
  attachmentIds: string[];
}

export type AttachmentMediaKind = "image" | "video" | "livePhoto";

export interface PresignAttachmentFileInput {
  filename?: string;
  contentType: string;
  size: number;
  mediaKind?: AttachmentMediaKind;
  compressedContentType?: "image/jpeg" | "image/webp";
  pairedVideo?: {
    filename?: string;
    contentType: string;
    size: number;
  };
  poster?: {
    contentType: "image/jpeg";
    size: number;
  };
}

export interface PresignAttachmentUploadsInput {
  files: PresignAttachmentFileInput[];
}

export interface PresignedUploadTarget {
  key: string;
  putUrl: string;
  url: string;
  contentType: string;
}

export interface PresignedAttachmentItem {
  uuid: string;
  expiresAt?: string;
  original: PresignedUploadTarget;
  compressed?: PresignedUploadTarget;
  pairedVideo?: PresignedUploadTarget;
  poster?: PresignedUploadTarget;
}

export interface PresignAttachmentUploadsResponse {
  items: PresignedAttachmentItem[];
  reservationId?: string;
  expiresAt?: string;
}

export interface FinalizeAttachmentInput {
  clientId?: string;
  uuid: string;
  originalKey: string;
  compressedKey?: string;
  posterKey?: string;
  pairedVideoKey?: string;
  pairedVideoSize?: number;
  pairedVideoMimetype?: string;
  pairedVideoFilename?: string;
  size?: number;
  mimetype?: string;
  mediaKind?: AttachmentMediaKind;
  hash?: string;
  noteId?: string;
}

export interface FinalizeAttachmentUploadsInput {
  attachments: FinalizeAttachmentInput[];
  noteId?: string;
}

export interface RoteAttachment {
  id: string;
  roteid?: string | null;
  url: string;
  compressUrl?: string | null;
  posterUrl?: string | null;
  details?: Record<string, unknown>;
}

export interface NoteShareLink {
  token: string;
  createdAt: string;
}

export type NoteShareState =
  | { active: false }
  | { active: true; token: string; createdAt: string; url: string | null };

export interface ResolvedNoteShareLink extends NoteShareLink {
  url: string;
}
