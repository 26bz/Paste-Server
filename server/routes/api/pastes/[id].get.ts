import { getPasteOrThrow } from "~/services/paste-service";

export default defineEventHandler((event) =>
  getPasteOrThrow(getRouterParam(event, "id")!),
);
