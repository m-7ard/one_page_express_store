import { z } from "zod";

export const userSerializer = z.object({
    id: z.string(),
    username: z.string(),
    is_admin: z
        .number()
        .min(0)
        .max(1)
        .transform((value) => Boolean(value)),
});

export const productSerializer = z.object({
    id: z.number(),
    name: z.string(),
    kind: z.string(),
    description: z.string(),
    price: z.number(),
    specification: z.string().transform<Record<string, string>>((value) => JSON.parse(value)),
    images: z.string().transform<string[]>((value) => JSON.parse(value)),
    user_id: z.string(),
});
