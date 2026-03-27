import { createPaste } from "~/services/paste-service";
import { createPasteInputSchema, MAX_CONTENT_BYTES } from "~/schemas/paste";
import { defineHandler, HTTPError } from "nitro";
import { getRequestIP, getRequestURL } from "nitro/h3";

export default defineHandler(async (event) => {
  let body: unknown;
  try {
    body = await event.req.json();
  } catch {
    throw new HTTPError({
      status: 400,
      message: "Invalid payload",
    });
  }

  const parsed = createPasteInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPError({
      status: 400,
      message: "Invalid payload",
      data: parsed.error.flatten(),
    });
  }

  const byteSize = new TextEncoder().encode(parsed.data.content).length;

  if (byteSize > MAX_CONTENT_BYTES) {
    throw new HTTPError({
      status: 413,
      message: `Paste too large. Limit ${Math.floor(MAX_CONTENT_BYTES / 1024)}KB.`,
    });
  }

  const paste = await createPaste(parsed.data, {
    ip: getRequestIP(event, { xForwardedFor: true }),
    userAgent: event.req.headers.get("user-agent"),
  });

  const url = getRequestURL(event);

  event.res.status = 201;

  return {
    id: paste.id,
    url: `${url.origin}/p/${paste.id}`,
    rawUrl: `${url.origin}/api/pastes/${paste.id}/raw`,
    expiresAt: paste.expiresAt,
    createdAt: paste.createdAt,
  };
});
