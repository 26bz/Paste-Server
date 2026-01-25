import { getPasteOrThrow } from "~/services/paste-service";

export default eventHandler(async (event) => {
  const paste = await getPasteOrThrow(event.context.params?.id);
  setResponseHeader(event, "Content-Type", "text/plain; charset=utf-8");
  setResponseHeader(
    event,
    "Content-Disposition",
    `inline; filename="xyra-paste-${paste.id}.log"`,
  );
  return paste.content;
});
