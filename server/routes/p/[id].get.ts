import { getPasteOrThrow } from "~/services/paste-service";
import { escapeHtml, renderLayout } from "~/templates/layout";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing paste id",
    });
  }

  const paste = await getPasteOrThrow(id);
  const host = getRequestHost(event, { xForwardedHost: true });

  const metadataList = `
    <ul class="list-group list-group-flush">
      <li class="list-group-item bg-transparent text-light border-secondary">
        <strong>ID:</strong> ${paste.id}
      </li>
      ${
        paste.source
          ? `<li class="list-group-item bg-transparent text-light border-secondary"><strong>Source:</strong> ${escapeHtml(paste.source)}</li>`
          : ""
      }
      <li class="list-group-item bg-transparent text-light border-secondary">
        <strong>Created:</strong> ${formatDate(paste.createdAt)}
      </li>
      <li class="list-group-item bg-transparent text-light border-secondary">
        <strong>Expires:</strong> ${formatExpiry(paste.expiresAt)}
      </li>
    </ul>
  `;

  const body = `
    <div class="mb-3">
      <a class="btn btn-link text-muted text-decoration-none" href="/">← Back to home</a>
    </div>

    <div class="card shadow-sm p-4 mb-4">
      <div class="d-flex justify-content-between flex-wrap gap-2 align-items-start">
        <div>
          <h1 class="h4 mb-2">${escapeHtml(paste.title)}</h1>
          <p class="text-muted mb-0">Share this link with support to review the logs.</p>
        </div>

        <div class="d-flex gap-2">
          <a class="btn btn-outline-light btn-sm" href="/api/pastes/${paste.id}/raw" target="_blank" rel="noopener">Raw</a>
          <button
            class="btn btn-outline-info btn-sm"
            id="copy-link"
            data-url="${escapeHtml(`https://${host}/p/${paste.id}`)}"
          >
            Copy link
          </button>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-12 col-lg-4">
        <div class="card shadow-sm p-4">
          <h2 class="h6">Details</h2>
          ${metadataList}
        </div>
      </div>

      <div class="col-12 col-lg-8">
        <div class="card shadow-sm p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="h6 mb-0">Log contents</h2>
            <button class="btn btn-sm btn-secondary" id="copy-log">Copy log</button>
          </div>

          <div
            class="log-viewer"
            id="log"
            data-raw="${escapeHtml(paste.content)}"
          >
            ${renderLogLines(paste.content)}
          </div>
        </div>
      </div>
    </div>
  `;

  const inlineScript = String.raw`
(() => {
  const copyLinkBtn = document.getElementById("copy-link");
  const copyLogBtn = document.getElementById("copy-log");

  copyLinkBtn?.addEventListener("click", async () => {
    const url = copyLinkBtn.dataset.url;
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      copyLinkBtn.textContent = "Copied!";
      setTimeout(() => (copyLinkBtn.textContent = "Copy link"), 2000);
    } catch {
      copyLinkBtn.textContent = "Failed";
      setTimeout(() => (copyLinkBtn.textContent = "Copy link"), 2000);
    }
  });

  copyLogBtn?.addEventListener("click", async () => {
    const logEl = document.getElementById("log");
    const rawLog =
      logEl?.getAttribute("data-raw") ?? logEl?.textContent ?? "";

    try {
      await navigator.clipboard.writeText(rawLog);
      copyLogBtn.textContent = "Copied!";
      setTimeout(() => (copyLogBtn.textContent = "Copy log"), 2000);
    } catch {
      copyLogBtn.textContent = "Failed";
      setTimeout(() => (copyLogBtn.textContent = "Copy log"), 2000);
    }
  });
})();
`;

  return renderLayout({
    title: `${paste.title} · Xyra Paste`,
    body,
    inlineScript,
  });
});

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatExpiry = (expiresAt: number | null) => {
  if (!expiresAt) return "Never";

  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) return "Expired";

  return new Date(expiresAt).toLocaleString();
};

const renderLogLines = (content: string) => {
  const normalized = content.replace(/\r\n/g, "\n").split("\n");

  return normalized
    .map((line, index) => {
      const safeLine = escapeHtml(line) || "&nbsp;";
      return `<div class="log-line">
        <span class="log-line-number">${index + 1}</span>
        <span class="log-line-text">${safeLine}</span>
      </div>`;
    })
    .join("");
};
