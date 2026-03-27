import { getPasteOrThrow } from "~/services/paste-service";
import { defineHandler } from "nitro";
import { getRouterParam } from "nitro/h3";

export default defineHandler((event) =>
  getPasteOrThrow(getRouterParam(event, "id")!),
);
