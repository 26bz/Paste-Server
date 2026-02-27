import { z } from "zod";

export const MAX_CONTENT_BYTES = 256 * 1024; // 256KB
export const TITLE_MAX = 120;
export const SOURCE_MAX = 120;
export const ALLOWED_EXPIRATIONS_MINUTES = [10, 60, 360, 1440, 10080] as const; // 10m, 1h, 6h, 1d, 7d

const expiresSchema = z
  .union([
    z.coerce.number().int().positive().max(ALLOWED_EXPIRATIONS_MINUTES.at(-1)!),
    z.literal("never"),
    z.literal(null),
    z.undefined(),
  ])
  .transform((value) => {
    if (value === "never" || value === null || typeof value === "undefined") {
      return null;
    }
    if (
      !ALLOWED_EXPIRATIONS_MINUTES.includes(
        value as (typeof ALLOWED_EXPIRATIONS_MINUTES)[number],
      )
    ) {
      throw new z.ZodError([
        {
          code: "custom",
          message: "Unsupported expiration option",
          path: ["expiresInMinutes"],
        },
      ]);
    }
    return value as number;
  });

export const createPasteInputSchema = z
  .object({
    content: z.string().min(1, "Log content is required"),
    title: z
      .string()
      .trim()
      .max(TITLE_MAX, `Title must be <= ${TITLE_MAX} characters`)
      .optional(),
    source: z
      .string()
      .trim()
      .max(SOURCE_MAX, `Source must be <= ${SOURCE_MAX} characters`)
      .optional(),
    expiresInMinutes: expiresSchema,
  })
  .strict();

export type CreatePasteInput = z.infer<typeof createPasteInputSchema>;
