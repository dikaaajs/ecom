import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  imageUrl: z.string().url("Invalid URL").optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  inStock: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
