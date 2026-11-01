import { z } from "zod";

const optionalDimension = z.number().int().nonnegative().nullable().optional();

export const productInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(10000).nullable().optional(),
  price: z.number().finite().nonnegative().max(99999999),
  stock: z.number().int().nonnegative().default(0),
  type: z.enum(["PHYSICAL", "DIGITAL"]).default("PHYSICAL"),
  weight: z.number().int().nonnegative().nullable().optional(),
  length: optionalDimension,
  width: optionalDimension,
  height: optionalDimension,
  imageUrl: z.string().max(2048).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).default([]),
  images: z.array(z.string().max(2048)).max(30).default([]),
  isPublished: z.boolean().default(true),
}).strict().superRefine((data, ctx) => {
  if (data.type === "PHYSICAL" && (!data.weight || data.weight < 1)) {
    ctx.addIssue({ code: "custom", path: ["weight"], message: "Physical products require a weight of at least 1 gram" });
  }
});
export type ProductInput = z.infer<typeof productInputSchema>;
