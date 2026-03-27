const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type ErrorLike = {
  status?: number;
  statusCode?: number;
  message?: string;
  statusMessage?: string;
  data?: unknown;
  stack?: string;
};

export default (error: ErrorLike, event: { path?: string; req?: Request }) => {
  const status = Math.max(
    100,
    Math.min(599, Number(error?.statusCode ?? error?.status ?? 500) || 500),
  );
  const message =
    error?.statusMessage ??
    error?.message ??
    (status >= 500 ? "Internal Server Error" : "Request Error");

  const path =
    event?.path ??
    (() => {
      try {
        return new URL(event?.req?.url ?? "http://localhost/").pathname;
      } catch {
        return "/";
      }
    })();

  const accept = event?.req?.headers?.get("accept") ?? "";
  const wantsJson =
    path.startsWith("/api/") || accept.includes("application/json");

  if (wantsJson) {
    const payload: Record<string, unknown> = { status, message };
    if (error?.data !== undefined) {
      payload.data = error.data;
    }
    return new Response(JSON.stringify(payload), {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    });
  }

  const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${status} ${escapeHtml(message)}</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #0f172a; color: #e2e8f0; }
      main { max-width: 60rem; margin: 0 auto; }
      h1 { margin: 0 0 1rem; font-size: 1.75rem; }
      p { margin: 0.5rem 0; color: #cbd5e1; }
      code { color: #f8fafc; background: #1e293b; padding: 0.15rem 0.35rem; border-radius: 0.35rem; }
    </style>
  </head>
  <body>
    <main>
      <h1>${status} ${escapeHtml(message)}</h1>
      <p>Path: <code>${escapeHtml(path)}</code></p>
    </main>
  </body>
</html>`;

  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
};
