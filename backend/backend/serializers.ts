import { number, z } from "zod";
import { dbOperation, mysqlGetQuery, mysqlQueryTableByID } from "./utils.js";
import { DatabaseCartProduct, DatabaseProduct } from "./database_types.js";
import { orderSchema } from "./schemas.js";

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
        id: z.number().min(1),
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

export const cartSerializer = z
    .object({
        id: z.number().min(1),
        user_id: z.string(),
    })
    .transform(async (values, ctx) => {
        const cartProducts = await dbOperation(
            async (connection) =>
                await mysqlGetQuery<DatabaseCartProduct>(
                    connection.execute("SELECT * FROM cart_product WHERE cart_id = ?", [values.id]),
                ),
        );
        const validation = await z.array(cartProductSerializer).safeParseAsync(cartProducts);
        if (!validation.success) {
            validation.error.issues.forEach((issue) => {
                ctx.addIssue(issue);
            });
            return z.NEVER;
        }

        return {
            ...values,
            products: validation.data,
        };
    });

export const orderSerializer = z.object({
    id: z.number().min(1),
    user_id: z.string().nullable(),
    product_id: z.number().min(1).nullable(),
    amount: z.number().min(1),
    date_created: z.date(),
    archive: z.string().transform<Record<string, any>>((value, ctx) => {
        try {
            return JSON.parse(value);
        } catch (error) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Error parsing specification.",
            });
            return z.NEVER;
        }
    }),
    shipping_name: z.string(),
    shipping_address_primary: z.string(),
    shipping_address_secondary: z.string(),
    shipping_city: z.string(),
    shipping_state: z.string(),
    shipping_zip: z.string(),
    shipping_country: z.string(),
    status: orderSchema.shape.status,
});

export const orderShippingSerializer = z.object({
    id: z.number().min(1),
    order_id: z.number().min(1).nullable(),
    tracking_number: z.string(),
    courier_name: z.string(),
    additional_information: z.string(),
    date_created: z.date(),
})