import { defineHandler, HTTPError } from "nitro";
import { useStorage } from "nitro/storage";
import { getRequestIP, getRequestURL } from "nitro/h3";
import { useRuntimeConfig } from "nitro/runtime-config";

type RateLimitRecord = { count: number; resetAt: number };

export default defineHandler(async (event) => {
  if (event.req.method !== "POST") return;

  const url = getRequestURL(event);
  if (!url.pathname.startsWith("/api/pastes")) return;

  const { windowMs, maxRequests } = useRuntimeConfig().paste.rateLimit;

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

    event.res.headers.set("Retry-After", String(retryAfter));

    throw new HTTPError({
      status: 429,
      message: `Rate limit exceeded. Try again in ${retryAfter}s.`,
    });
  }

  current.count += 1;

  await storage.setItem(key, current);
});
