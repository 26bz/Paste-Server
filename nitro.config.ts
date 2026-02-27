import { defineNitroConfig } from "nitropack/config";

const storageDriver = process.env.XYRA_STORAGE_DRIVER ?? "kv";
const kvBindingNames = {
  pastes: process.env.XYRA_PASTES_KV_BINDING ?? "KV_PASTES",
  meta: process.env.XYRA_PASTES_META_KV_BINDING ?? "KV_PASTES_META",
  ratelimits: process.env.XYRA_RATELIMITS_KV_BINDING ?? "KV_RATELIMITS",
};

const defaultKvNamespaceId =
  process.env.XYRA_DEFAULT_KV_ID ?? "ca398e05df154f6981f8ae49a12c2c2d";
const kvNamespaceIds = {
  pastes: process.env.XYRA_PASTES_KV_ID ?? defaultKvNamespaceId,
  meta:
    process.env.XYRA_PASTES_META_KV_ID ??
    process.env.XYRA_PASTES_KV_ID ??
    defaultKvNamespaceId,
  ratelimits:
    process.env.XYRA_RATELIMITS_KV_ID ??
    process.env.XYRA_PASTES_KV_ID ??
    defaultKvNamespaceId,
};

const fsStorage = {
  pastes: {
    driver: "fs",
    base: ".data/pastes",
  },
  "pastes:meta": {
    driver: "fs",
    base: ".data/meta",
  },
  ratelimits: {
    driver: "fs",
    base: ".data/ratelimits",
  },
};

const kvStorage = {
  pastes: {
    driver: "cloudflare-kv-binding",
    binding: kvBindingNames.pastes,
  },
  "pastes:meta": {
    driver: "cloudflare-kv-binding",
    binding: kvBindingNames.meta,
  },
  ratelimits: {
    driver: "cloudflare-kv-binding",
    binding: kvBindingNames.ratelimits,
  },
};

const storage = storageDriver === "fs" ? fsStorage : kvStorage;
const devStorage = storageDriver === "fs" ? undefined : fsStorage;
const kvNamespaces = Object.entries(kvBindingNames)
  .map(([key, binding]) => {
    const id = kvNamespaceIds[key as keyof typeof kvNamespaceIds];
    return id
      ? {
          binding,
          id,
        }
      : null;
  })
  .filter(Boolean) as Array<{ binding: string; id: string }>;

export default defineNitroConfig({
  compatibilityDate: "2024-12-18",
  preset: "cloudflare_module",
  srcDir: "server",
  imports: {
    autoImport: true,
  },
  cloudflare: {
    deployConfig: true,
    nodeCompat: true,
    wrangler: {
      name: "xyra-paste",
      main: ".output/server/index.mjs",
      compatibility_date: "2024-12-18",
      vars: {
        XYRA_STORAGE_DRIVER: "${XYRA_STORAGE_DRIVER}",
        XYRA_CORS_ORIGINS: "${XYRA_CORS_ORIGINS}",
      },
      kv_namespaces: kvNamespaces,
    },
  },
  runtimeConfig: {
    paste: {
      rateLimit: {
        windowMs: Number(process.env.XYRA_RATE_LIMIT_WINDOW_MS ?? 60_000),
        maxRequests: Number(process.env.XYRA_RATE_LIMIT_MAX ?? 120),
      },
    },
    public: {
      paste: {
        defaultKey: process.env.XYRA_UI_DEFAULT_KEY || "",
      },
    },
  },
  storage,
  devStorage,
});
