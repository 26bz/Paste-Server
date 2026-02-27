import { createPaste } from "~/services/paste-service";
import { createPasteInputSchema, MAX_CONTENT_BYTES } from "~/schemas/paste";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const parsed = createPasteInputSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid payload",
      data: parsed.error.flatten(),
    });
  }

  const byteSize = new TextEncoder().encode(parsed.data.content).length;

  if (byteSize > MAX_CONTENT_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: `Paste too large. Limit ${Math.floor(MAX_CONTENT_BYTES / 1024)}KB.`,
    });
  }

  const paste = await createPaste(parsed.data, {
    ip: getRequestIP(event, { xForwardedFor: true }),
    userAgent: getRequestHeader(event, "user-agent"),
  });

  const url = getRequestURL(event);

  setResponseStatus(event, 201, "Created");

  return {
    id: paste.id,
    url: `${url.origin}/p/${paste.id}`,
    rawUrl: `${url.origin}/api/pastes/${paste.id}/raw`,
    expiresAt: paste.expiresAt,
    createdAt: paste.createdAt,
  };
});
