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

export interface RoteReaction {
  id: string;
  type: string;
  roteid: string;
  userid: string;
}

export interface AddReactionInput {
  type: string;
  roteid: string;
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
