type RateLimitRecord = { count: number; resetAt: number };

export default defineEventHandler(async (event) => {
  if (event.method !== "POST") return;

  const url = getRequestURL(event);
  if (!url.pathname.startsWith("/api/pastes")) return;

  const { windowMs, maxRequests } = useRuntimeConfig(event).paste.rateLimit;

  const storage = useStorage("ratelimits");

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  const key = `pastes:${ip}`;

  const now = Date.now();

  const current: RateLimitRecord = (await storage.getItem<RateLimitRecord>(
    key,
  )) ?? {
    count: 0,
    resetAt: now + windowMs,
  };

  if (current.resetAt <= now) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }

  if (current.count >= maxRequests) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);

    setResponseHeader(event, "Retry-After", retryAfter);

    throw createError({
      statusCode: 429,
      statusMessage: `Rate limit exceeded. Try again in ${retryAfter}s.`,
    });
  }

  current.count += 1;

  await storage.setItem(key, current);
});
