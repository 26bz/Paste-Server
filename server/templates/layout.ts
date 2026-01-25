const escapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

export const escapeHtml = (value: string | undefined | null) => {
  if (!value) return "";
  return value.replace(/[&<>"'`]/g, (char) => escapeMap[char] ?? char);
};

type LayoutOptions = {
  title?: string;
  description?: string;
  body: string;
  inlineScript?: string;
};

export const renderLayout = ({
  title = "Xyra Paste",
  description = "Minimal pastebin for XyraPanel diagnostics",
  body,
  inlineScript = "",
}: LayoutOptions) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <style>
      body {
        background: #0d1117;
        color: #f8fafc;
        min-height: 100vh;
        padding-top: 2rem;
        padding-bottom: 2rem;
      }
      .card {
        background-color: #161b22;
        border-color: rgba(255,255,255,0.08);
      }
      .text-muted {
        color: #94a3b8 !important;
      }
      .recent-title {
        color: #e2e8f0 !important;
      }
      .form-label {
        color: #e2e8f0 !important;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #f8fafc !important;
      }
      ::placeholder {
        color: rgba(226, 232, 240, 0.7) !important;
      }
      a {
        color: #5bc0de;
      }
      textarea {
        min-height: 260px;
      }
      pre {
        background-color: #161b22;
        border-radius: .65rem;
        border: 1px solid rgba(255,255,255,0.12);
        padding: 1rem;
        white-space: pre-wrap;
        color: #f8fafc;
      }
      .log-viewer {
        background-color: #161b22;
        border-radius: .65rem;
        border: 1px solid rgba(255,255,255,0.12);
        padding: 1rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 0.92rem;
        overflow-x: auto;
      }
      .log-line {
        display: flex;
        gap: 0.5rem;
        line-height: 1.45;
      }
      .log-line-number {
        min-width: 2.25rem;
        text-align: left;
        color: rgba(226,232,240,0.7);
      }
      .log-line-text {
        flex: 1;
        white-space: pre-wrap;
        color: #f8fafc;
      }
    </style>
  </head>
  <body>
    <div class="container">
      ${body}
    </div>
    ${inlineScript ? `<script>${inlineScript}</script>` : ""}
  </body>
</html>`;
