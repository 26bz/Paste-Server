import { META_INDEX_KEY, type PasteSummary } from "~/services/paste-service";

export default defineTask({
  meta: {
    name: "prune-expired",
    description: "Removes expired pastes and cleans their metadata index.",
  },
  async run() {
    const pasteStorage = useStorage("pastes");
    const metaStorage = useStorage("pastes:meta");

    const entries = await pasteStorage.getKeys();
    const now = Date.now();
    let removed = 0;

    for (const key of entries) {
      const record = await pasteStorage.getItem<any>(key);
      if (!record) continue;

      if (record.expiresAt && record.expiresAt <= now) {
        await pasteStorage.removeItem(key);
        removed += 1;
      }
    }

    if (removed > 0) {
      const summaries =
        (await metaStorage.getItem<PasteSummary[]>(META_INDEX_KEY)) ?? [];
      const filtered = summaries.filter((entry) => {
        if (!entry.expiresAt) return true;
        return entry.expiresAt > now;
      });
      await metaStorage.setItem(META_INDEX_KEY, filtered);
    }

    return { result: { removed } };
  },
});
