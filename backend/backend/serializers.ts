import { number, z } from "zod";
import { mysqlQueryTableByID } from "./utils.js";
import { DatabaseProduct } from "./database_types.js";

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

export const cartProductSerializer = z
    .object({
        amount: z.number().min(1),
        product_id: z.number().min(1),
    })
    .transform(async ({ product_id, ...rest }, ctx) => {
        const query = await mysqlQueryTableByID<DatabaseProduct>({ table: "product", id: product_id });
        if (query.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Product does not exist.",
            });
            return z.NEVER;
        }
        const [product] = query;
        return {
            ...rest,
            product: productSerializer.parse(product),
        };
    });
