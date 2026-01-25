import { getPasteOrThrow } from "~/services/paste-service";

export default eventHandler((event) =>
  getPasteOrThrow(event.context.params?.id),
);
