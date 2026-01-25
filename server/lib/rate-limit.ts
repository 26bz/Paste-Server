type RateLimitRecord = { count: number; resetAt: number };

export const enforceRateLimit = async (event) => {
  const { windowMs, maxRequests } = useRuntimeConfig(event).paste.rateLimit;
  const storage = useStorage("ratelimits");
  const ip = getRequestIP(event, { xForwardedFor: true });
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
    throw createError({
      statusCode: 429,
      statusMessage: `Rate limit exceeded. Try again in ${retryAfter}s.`,
    });
  }

  current.count += 1;
  await storage.setItem(key, current);
};
