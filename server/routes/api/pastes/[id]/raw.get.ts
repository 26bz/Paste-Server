import { getPasteOrThrow } from "~/services/paste-service";
import { defineHandler } from "nitro";
import { getRouterParam } from "nitro/h3";
export default defineHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const paste = await getPasteOrThrow(id);
  event.res.headers.set("Content-Type", "text/plain; charset=utf-8");
  event.res.headers.set(
    "Content-Disposition",
    `inline; filename="xyra-paste-${paste.id}.log"`,
  );

  return paste.content;
});
