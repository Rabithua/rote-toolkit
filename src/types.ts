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
  type?: string;
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
  state?: string;
  type?: string;
  pin?: boolean;
}

export interface SearchNotesInput {
  keyword: string;
  limit?: number;
  skip?: number;
}

export interface ListNotesInput {
  limit?: number;
  skip?: number;
}
