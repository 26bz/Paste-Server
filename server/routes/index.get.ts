import { renderLayout, escapeHtml } from "~/templates/layout";
import { getRecentPastes } from "~/services/paste-service";
import {
  ALLOWED_EXPIRATIONS_MINUTES,
  MAX_CONTENT_BYTES,
} from "~/schemas/paste";

const expirationLabels: Record<number, string> = {
  10: "10 minutes",
  60: "1 hour",
  360: "6 hours",
  1440: "24 hours",
  10080: "7 days",
};

export default eventHandler(async () => {
  const runtimeConfig = useRuntimeConfig();
  const defaultKey = runtimeConfig.public?.paste?.defaultKey ?? "";
  const recent = await getRecentPastes(5);
  const limitKb = Math.floor(MAX_CONTENT_BYTES / 1024);

  const recentMarkup =
    recent.length === 0
      ? `<p class="text-muted mb-0">No pastes yet. Your latest uploads will land here.</p>`
      : `<ul class="list-group list-group-flush">
          ${recent
            .map((item) => {
              const preview = (item.contentPreview ?? "").trim();
              return `
                <li class="list-group-item bg-transparent text-light border-secondary">
                  <div class="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
                    <a class="fw-semibold link-info recent-title" href="/p/${
                      item.id
                    }">${escapeHtml(item.title)}</a>
                    <small class="text-muted">${formatDate(
                      item.createdAt,
                    )}</small>
                  </div>
                  ${
                    item.source
                      ? `<small class="d-block text-muted">Source: ${escapeHtml(
                          item.source,
                        )}</small>`
                      : ""
                  }
                  ${
                    preview
                      ? `<small class="d-block text-muted">${escapeHtml(
                          preview.slice(0, 120),
                        )}${preview.length > 120 ? "…" : ""}</small>`
                      : ""
                  }
                </li>
              `;
            })
            .join("")}
        </ul>`;

  const expirationOptions = ALLOWED_EXPIRATIONS_MINUTES.map(
    (value) => `<option value="${value}">${expirationLabels[value]}</option>`,
  ).join("");

  const body = `
    <div class="row g-4">
      <div class="col-12 col-lg-7">
        <div class="card shadow-sm p-4">
          <h1 class="h3 mb-3">Xyra Paste</h1>
          <p class="text-muted mb-4">Upload panel logs and share a link with support. Max ${limitKb}KB per paste.</p>
          <form id="paste-form" class="vstack gap-3" data-default-key="${escapeHtml(
            defaultKey,
          )}">
            <div>
              <label class="form-label" for="title">Title (optional)</label>
              <input class="form-control form-control-lg bg-dark border-secondary text-light" id="title" name="title" maxlength="120" placeholder="Example: Node-04 crash on startup" />
            </div>
            <div>
              <label class="form-label" for="source">Source / Host (optional)</label>
              <input class="form-control bg-dark border-secondary text-light" id="source" name="source" maxlength="120" placeholder="node-04.chi.xyrapanel" />
            </div>
            <div>
              <label class="form-label" for="expires">Expires</label>
              <select class="form-select bg-dark border-secondary text-light" id="expires" name="expires">
                ${expirationOptions}
                <option value="never">Never</option>
              </select>
            </div>
            <div>
              <label class="form-label" for="content">Logs</label>
              <textarea class="form-control bg-dark border-secondary text-light" id="content" name="content" placeholder="Paste stack traces or console output here..." required></textarea>
            </div>
            <button class="btn btn-info text-dark fw-semibold" type="submit">Create paste</button>
            <div class="small mt-1" id="status"></div>
          </form>
        </div>
      </div>
      <div class="col-12 col-lg-5">
        <div class="card shadow-sm p-4">
          <h2 class="h5 mb-3">Recent uploads</h2>
          <div id="recent-list" data-has-items="${recent.length > 0}">
            ${recentMarkup}
          </div>
        </div>
      </div>
    </div>
  `;

  const inlineScript = String.raw`
    (function () {
      var form = document.getElementById("paste-form");
      var statusEl = document.getElementById("status");
      var recentList = document.getElementById("recent-list");

      if (!form || !statusEl) {
        return;
      }

      var escapeHtml = function (value) {
        if (!value) return "";
        return value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      };

      var ensureRecentList = function () {
        if (!recentList) return null;
        var list = recentList.querySelector("ul.list-group");
        if (list) return list;
        recentList.innerHTML = "";
        list = document.createElement("ul");
        list.className = "list-group list-group-flush";
        recentList.appendChild(list);
        return list;
      };

      var setStatus = function (message, type) {
        if (type === void 0) type = "info";
        statusEl.textContent = message;
        statusEl.className = "small mt-1 text-" + type;
      };

      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        setStatus("");

        var formData = new FormData(form);
        var toText = function (value) {
          return typeof value === "string" ? value : value ? value.toString() : "";
        };
        var payload = {
          content: toText(formData.get("content")),
          title: toText(formData.get("title")) || undefined,
          source: toText(formData.get("source")) || undefined,
          expiresInMinutes: toText(formData.get("expires")) || null,
        };

        if (!payload.content.trim()) {
          setStatus("Please paste some logs first.", "warning");
          return;
        }

        setStatus("Uploading…");
        try {
          if (payload.expiresInMinutes === "never") {
            payload.expiresInMinutes = "never";
          } else if (payload.expiresInMinutes) {
            payload.expiresInMinutes = Number(payload.expiresInMinutes);
          } else {
            payload.expiresInMinutes = null;
          }

          var headers = {
            "Content-Type": "application/json",
          };

          var response = await fetch("/api/pastes", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            var data = await response.json().catch(function () {
              return {};
            });
            throw new Error(data && data.statusMessage ? data.statusMessage : "Failed to create paste");
          }

          var result = await response.json();
          setStatus("Paste created: " + result.url, "success");
          form.reset();
          var list = ensureRecentList();
          if (list) {
            var preview = payload.content.trim().slice(0, 120);
            var created = result.createdAt ? new Date(result.createdAt) : new Date();
            var formattedDate = created.toLocaleString(void 0, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            var li = document.createElement("li");
            li.className = "list-group-item bg-transparent text-light border-secondary";
            li.innerHTML =
              '<div class="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">' +
              '<a class="fw-semibold link-info recent-title" href="' +
              escapeHtml(result.url) +
              '">' +
              escapeHtml(payload.title || "Untitled Paste") +
              "</a>" +
              '<small class="text-muted">' +
              escapeHtml(formattedDate) +
              "</small>" +
              "</div>" +
              (payload.source
                ? '<small class="d-block text-muted">Source: ' +
                  escapeHtml(payload.source) +
                  "</small>"
                : "") +
              (preview
                ? '<small class="d-block text-muted">' +
                  escapeHtml(preview) +
                  (payload.content.trim().length > 120 ? "…" : "") +
                  "</small>"
                : "");
            list.prepend(li);
          }
        } catch (error) {
          setStatus((error && error.message) || "Something went wrong.", "danger");
        }
      });
    })();
  `;

  return renderLayout({
    title: "Xyra Paste · Game panel logs",
    body,
    inlineScript,
  });
});

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
