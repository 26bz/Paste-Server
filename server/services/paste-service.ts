import type { CreatePasteInput } from "~/schemas/paste";

export type PasteRecord = {
  id: string;
  title: string;
  content: string;
  source?: string;
  expiresAt: number | null;
  createdAt: number;
  client?: { ip?: string | null; userAgent?: string | null };
};

export type PasteSummary = Omit<PasteRecord, "content"> & {
  contentPreview: string;
};

export const META_INDEX_KEY = "index.json";
const META_LIMIT = 25;

const generateId = () => {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return (
    btoa(String.fromCharCode(...bytes))
      .replace(/[+/=]/g, "")
      .slice(0, 8) || crypto.randomUUID().slice(0, 8)
  );
};

const normalizeTitle = (title?: string) => title?.trim() || "Untitled Paste";

type CreatePasteMetadata = { ip?: string | null; userAgent?: string | null };

export const createPaste = async (
  input: CreatePasteInput,
  meta: CreatePasteMetadata = {},
): Promise<PasteRecord> => {
  const pasteStorage = useStorage("pastes");
  const metaStorage = useStorage("pastes:meta");
  const now = Date.now();
  const expiresAt = input.expiresInMinutes
    ? now + input.expiresInMinutes * 60_000
    : null;

  let id: string;
  do {
    id = generateId();
  } while (await pasteStorage.hasItem(`${id}.json`));

  const record: PasteRecord = {
    id,
    title: normalizeTitle(input.title),
    content: input.content,
    source: input.source?.trim() || undefined,
    expiresAt,
    createdAt: now,
    client:
      meta.ip || meta.userAgent
        ? {
            ip: meta.ip ?? null,
            userAgent: meta.userAgent ?? null,
          }
        : undefined,
  };

  await pasteStorage.setItem(`${record.id}.json`, record);
  await updateMetaIndex(metaStorage, record);

  return record;
};

export const getPaste = async (id: string): Promise<PasteRecord | null> => {
  const pasteStorage = useStorage("pastes");
  const record = await pasteStorage.getItem<PasteRecord | null>(`${id}.json`);
  if (!record) {
    return null;
  }
  if (record.expiresAt && record.expiresAt <= Date.now()) {
    await removePaste(id);
    return null;
  }
  return record;
};

export const getRecentPastes = async (limit = 10): Promise<PasteSummary[]> => {
  const metaStorage = useStorage("pastes:meta");
  const summaries =
    (await metaStorage.getItem<PasteSummary[]>(META_INDEX_KEY)) ?? [];
  return summaries.slice(0, limit);
};

export const removePaste = async (id: string) => {
  const pasteStorage = useStorage("pastes");
  const metaStorage = useStorage("pastes:meta");
  await pasteStorage.removeItem(`${id}.json`);
  const current =
    (await metaStorage.getItem<PasteSummary[]>(META_INDEX_KEY)) ?? [];
  const next = current.filter((entry: PasteSummary) => entry.id !== id);
  await metaStorage.setItem(META_INDEX_KEY, next);
};

export const getPasteOrThrow = async (id: string | undefined) => {
  if (!id)
    throw createError({ statusCode: 400, statusMessage: "Missing paste id" });
  const paste = await getPaste(id);
  if (!paste)
    throw createError({ statusCode: 404, statusMessage: "Paste not found" });
  return paste;
};

const updateMetaIndex = async (
  metaStorage: ReturnType<typeof useStorage>,
  record: PasteRecord,
) => {
  const existing =
    (await metaStorage.getItem<PasteSummary[]>(META_INDEX_KEY)) ?? [];
  const summary: PasteSummary = {
    id: record.id,
    title: record.title,
    source: record.source,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
    contentPreview: record.content.slice(0, 160),
  };
  const filtered = existing.filter(
    (entry: PasteSummary) => entry.id !== record.id,
  );
  filtered.unshift(summary);
  const trimmed = filtered.slice(0, META_LIMIT);
  await metaStorage.setItem(META_INDEX_KEY, trimmed);
};
