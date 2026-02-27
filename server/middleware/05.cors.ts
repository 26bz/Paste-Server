const ALLOWED_ORIGINS = (process.env.XYRA_CORS_ORIGINS ?? "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export default defineEventHandler((event) => {
  const origin = getRequestHeader(event, "origin");

  let allowedOrigin: string | undefined;

  if (ALLOWED_ORIGINS.includes("*")) {
    allowedOrigin = "*";
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    allowedOrigin = origin;
  }

  if (!allowedOrigin) return;

  setResponseHeader(event, "Access-Control-Allow-Origin", allowedOrigin);

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    setResponseHeader(event, key, value);
  }

  if (event.method?.toUpperCase() === "OPTIONS") {
    setResponseStatus(event, 204);
    return "";
  }
});
