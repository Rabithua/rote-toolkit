import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { once } from "node:events";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  uploadAttachmentFiles,
  type AttachmentUploadClient,
} from "../attachmentUpload.js";

describe("CLI attachment upload workflow", () => {
  let temporaryDirectory: string | undefined;

  afterEach(async () => {
    vi.restoreAllMocks();
    if (temporaryDirectory) {
      await rm(temporaryDirectory, { recursive: true, force: true });
      temporaryDirectory = undefined;
    }
  });

  async function fixture(name = "photo.jpg") {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "rote-toolkit-upload-"));
    const path = join(temporaryDirectory, name);
    await writeFile(path, Buffer.from("image-data"));
    return path;
  }

  function client(
    expiresAt = "2099-01-01T00:00:00.000Z",
    putUrl = "https://upload.example/original",
  ) {
    const manifest = {
      items: [
        {
          uuid: "upload-1",
          original: {
            key: "users/test/staging/reservation/uploads/upload-1.jpg",
            putUrl,
            url: "https://files.example/original",
            contentType: "image/jpeg",
          },
        },
      ],
      reservationId: "reservation-1",
      expiresAt,
    };
    return {
      presignAttachmentUploads: vi.fn().mockResolvedValue(manifest),
      refreshAttachmentUploadReservation: vi.fn().mockResolvedValue({
        ...manifest,
        expiresAt: "2099-01-01T00:00:00.000Z",
        items: [
          {
            ...manifest.items[0],
            original: {
              ...manifest.items[0].original,
              putUrl: "https://upload.example/refreshed",
            },
          },
        ],
      }),
      finalizeAttachmentUploads: vi
        .fn()
        .mockResolvedValue([{ id: "attachment-1", url: "https://files.example/original" }]),
    } satisfies AttachmentUploadClient;
  }

  it("uploads an explicit local file and finalizes it on the note", async () => {
    const path = await fixture();
    let uploadedBody = Buffer.alloc(0);
    let uploadedContentType: string | undefined;
    const uploadServer = createServer(async (request, response) => {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      uploadedBody = Buffer.concat(chunks);
      uploadedContentType = request.headers["content-type"];
      response.writeHead(request.method === "PUT" ? 200 : 405).end();
    });
    uploadServer.listen(0, "127.0.0.1");
    await once(uploadServer, "listening");
    const address = uploadServer.address();
    if (!address || typeof address === "string") throw new Error("Upload server did not bind");
    const putUrl = `http://127.0.0.1:${address.port}/original`;
    const mockClient = client("2099-01-01T00:00:00.000Z", putUrl);

    let result;
    try {
      result = await uploadAttachmentFiles(mockClient, "note-1", [path]);
    } finally {
      await new Promise<void>((resolve, reject) => {
        uploadServer.close((error) => (error ? reject(error) : resolve()));
      });
    }

    expect(result).toEqual([
      {
        path,
        attachment: { id: "attachment-1", url: "https://files.example/original" },
      },
    ]);
    expect(mockClient.presignAttachmentUploads).toHaveBeenCalledWith({
      files: [
        {
          filename: "photo.jpg",
          contentType: "image/jpeg",
          mediaKind: "image",
          size: 10,
        },
      ],
    });
    expect(uploadedBody.toString()).toBe("image-data");
    expect(uploadedContentType).toBe("image/jpeg");
    expect(mockClient.refreshAttachmentUploadReservation).not.toHaveBeenCalled();
    expect(mockClient.finalizeAttachmentUploads).toHaveBeenCalledWith({
      noteId: "note-1",
      attachments: [
        {
          uuid: "upload-1",
          originalKey: "users/test/staging/reservation/uploads/upload-1.jpg",
          size: 10,
          mimetype: "image/jpeg",
          mediaKind: "image",
        },
      ],
    });
  });

  it("refreshes an expiring reservation once before upload", async () => {
    const path = await fixture();
    const mockClient = client("2000-01-01T00:00:00.000Z");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    await uploadAttachmentFiles(mockClient, "note-1", [path]);

    expect(mockClient.refreshAttachmentUploadReservation).toHaveBeenCalledWith("reservation-1");
    expect(fetchSpy.mock.calls[0][0]).toBe("https://upload.example/refreshed");
  });

  it("rejects unsupported files before requesting upload credentials", async () => {
    const path = await fixture("document.pdf");
    const mockClient = client();

    await expect(uploadAttachmentFiles(mockClient, "note-1", [path])).rejects.toThrow(
      "Unsupported attachment type",
    );
    expect(mockClient.presignAttachmentUploads).not.toHaveBeenCalled();
  });
});
