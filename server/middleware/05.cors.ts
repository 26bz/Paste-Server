import { defineHandler } from "nitro";

const ALLOWED_ORIGINS = (process.env.XYRA_CORS_ORIGINS ?? "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export default defineHandler((event) => {
  const origin = event.req.headers.get("origin");

  let allowedOrigin: string | undefined;

  if (ALLOWED_ORIGINS.includes("*")) {
    allowedOrigin = "*";
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    allowedOrigin = origin;
  }

  if (!allowedOrigin) return;

  event.res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  if (allowedOrigin !== "*") {
    event.res.headers.set("Vary", "Origin");
  }

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    event.res.headers.set(key, value);
  }

  if (event.req.method === "OPTIONS") {
    event.res.status = 204;
    return "";
  }
});
