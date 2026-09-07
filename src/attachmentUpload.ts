import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import type { RoteClient } from "./api.js";
import type {
  AttachmentMediaKind,
  PresignAttachmentUploadsResponse,
  RoteAttachment,
} from "./types.js";

const CONTENT_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".webm": "video/webm",
  ".webp": "image/webp",
};

export type AttachmentUploadClient = Pick<
  RoteClient,
  | "presignAttachmentUploads"
  | "refreshAttachmentUploadReservation"
  | "finalizeAttachmentUploads"
>;

export type UploadedAttachmentFile = {
  path: string;
  attachment: RoteAttachment;
};

type PreparedFile = {
  path: string;
  filename: string;
  contentType: string;
  mediaKind: AttachmentMediaKind;
  size: number;
};

function contentTypeForPath(path: string): string {
  const contentType = CONTENT_TYPES[extname(path).toLowerCase()];
  if (!contentType) {
    throw new Error(`Unsupported attachment type: ${path}`);
  }
  return contentType;
}

async function prepareFile(path: string): Promise<PreparedFile> {
  const metadata = await stat(path);
  if (!metadata.isFile()) throw new Error(`Attachment path is not a file: ${path}`);
  if (!Number.isSafeInteger(metadata.size) || metadata.size <= 0) {
    throw new Error(`Attachment file is empty or too large to measure safely: ${path}`);
  }
  const contentType = contentTypeForPath(path);
  return {
    path,
    filename: basename(path),
    contentType,
    mediaKind: contentType.startsWith("video/") ? "video" : "image",
    size: metadata.size,
  };
}

function credentialsExpireSoon(response: PresignAttachmentUploadsResponse): boolean {
  if (!response.reservationId || !response.expiresAt) return false;
  const expiresAt = Date.parse(response.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt <= Date.now() + 5_000;
}

async function uploadFile(path: string, putUrl: string, contentType: string, size: number) {
  const stream = createReadStream(path);
  const response = await fetch(putUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(size),
      "Content-Type": contentType,
    },
    body: stream as unknown as RequestInit["body"],
    duplex: "half",
  } as RequestInit & { duplex: "half" });
  if (!response.ok) {
    throw new Error(`Attachment upload failed for ${path}: HTTP ${response.status}`);
  }
}

export async function uploadAttachmentFiles(
  client: AttachmentUploadClient,
  noteId: string,
  paths: string[],
): Promise<UploadedAttachmentFile[]> {
  if (!noteId?.trim()) throw new Error("noteId is required");
  if (paths.length === 0) throw new Error("At least one attachment file is required");
  if (paths.length > 9) throw new Error("Maximum 9 attachment files allowed");
  if (new Set(paths).size !== paths.length) throw new Error("Duplicate attachment paths are not allowed");

  const files = await Promise.all(paths.map(prepareFile));
  let presigned = await client.presignAttachmentUploads({
    files: files.map(({ filename, contentType, mediaKind, size }) => ({
      filename,
      contentType,
      mediaKind,
      size,
    })),
  });
  if (presigned.items.length !== files.length) {
    throw new Error("Rote API returned an incomplete attachment upload manifest");
  }

  const uuids = presigned.items.map((item) => item.uuid);
  for (let index = 0; index < files.length; index += 1) {
    if (credentialsExpireSoon(presigned)) {
      presigned = await client.refreshAttachmentUploadReservation(presigned.reservationId!);
    }
    const file = files[index];
    const item = presigned.items.find((candidate) => candidate.uuid === uuids[index]);
    if (!item) throw new Error(`Rote API omitted refreshed upload credentials for ${file.path}`);
    await uploadFile(file.path, item.original.putUrl, file.contentType, file.size);
  }

  const attachments = await client.finalizeAttachmentUploads({
    noteId,
    attachments: files.map((file, index) => {
      const item = presigned.items.find((candidate) => candidate.uuid === uuids[index]);
      if (!item) throw new Error(`Rote API omitted final upload credentials for ${file.path}`);
      return {
        uuid: item.uuid,
        originalKey: item.original.key,
        size: file.size,
        mimetype: file.contentType,
        mediaKind: file.mediaKind,
      };
    }),
  });
  if (attachments.length !== files.length) {
    throw new Error("Rote API finalized only part of the attachment upload");
  }
  return files.map((file, index) => ({ path: file.path, attachment: attachments[index] }));
}
