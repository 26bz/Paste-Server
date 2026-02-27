import { getPasteOrThrow } from "~/services/paste-service";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const paste = await getPasteOrThrow(id);
  setResponseHeader(event, "Content-Type", "text/plain; charset=utf-8");
  setResponseHeader(
    event,
    "Content-Disposition",
    `inline; filename="xyra-paste-${paste.id}.log"`,
  );

  return paste.content;
});
