import { z } from "zod";
import { access } from "fs/promises";
import { BASE_DIR } from "./settings.js";
import { dbOperation, mysqlGetOrThrow, mysqlGetQuery, mysqlQueryTableByID } from "./utils.js";
import { RowDataPacket } from "mysql2";
import { PRODUCT } from "./constants.js";
import { DatabaseUser } from "./database_types.js";

export const productSchema = z.object({
    id: z.coerce
        .number()
        .min(1)
        .refine(
            async (value) => {
                return await dbOperation(async (connection) => {
                    const [result] = await connection.execute<RowDataPacket[]>(`SELECT 1 FROM product WHERE id = ?`, [
                        value,
                    ]);
                    return result.length !== 0;
                });
            },
            { message: "Product doesn't exist." },
        )
        .optional(),
    name: z.string().min(1).max(50),
    description: z.string().max(512).default(""),
    price: z.coerce.number().min(0.1),
    kind: z.string().min(1).max(50),
    newImages: z
        .array(
            z.object({
                index: z.number(),
                file: z.object({
                    originalname: z.string(),
                    buffer: z.instanceof(Buffer),
                    mimetype: z.string().refine((value) => PRODUCT.ACCEPTED_FILE_FORMATS.includes(value), {
                        message: `Only ${PRODUCT.ACCEPTED_FILE_FORMATS.map((format) => format.split("/")[1]).join(", ")} files are accepted.`,
                    }),
                    size: z.number().max(PRODUCT.MAX_IMAGE_SIZE, {
                        message: `Max file size is ${PRODUCT.MAX_IMAGE_SIZE / 1028 ** 2}MB`,
                    }),
                }),
            }),
        )
        .max(PRODUCT.MAX_IMAGES_LENGTH, { message: `Cannot upload more than ${PRODUCT.MAX_IMAGES_LENGTH} files.` })
        .default([]),
    existingImages: z
        .array(
            z.object({
                index: z.number(),
                fileName: z.string().refine(
                    async (value) => {
                        try {
                            await access(`${BASE_DIR}/backend/media/${value}`);
                            return true;
                        } catch {
                            return false;
                        }
                    },
                    { message: "File does not exist." },
                ),
            }),
        )
        .default([]),
    specification: z.string().transform<Array<[string, string]>>((value, ctx) => {
        try {
            const specification = JSON.parse(value);
            const validator = z.array(z.tuple([z.string(), z.string()])).refine(
                (_value) => {
                    const seenFieldNames: string[] = [];
                    for (let i = 0; i < _value.length; i++) {
                        const [fieldName, fieldValue] = _value[i];
                        if (seenFieldNames.includes(fieldName)) {
                            return false;
                        }
                        seenFieldNames.push(fieldName);
                    }
                    return true;
                },
                { message: "Specification field names must be unique and cannot repeat." },
            );
            const validation = validator.safeParse(specification);
            if (validation.success) {
                return specification;
            } else {
                validation.error.errors.forEach(({ message }) => {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: message,
                    });
                });

                return z.NEVER;
            }
        } catch (error) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Error parsing specification.",
            });
            return z.NEVER;
        }
    }),
    user_id: z.string().refine(async (value) => {
        return await dbOperation(async (connection) => {
            const [result] = await connection.execute<RowDataPacket[]>(`SELECT 1 FROM user WHERE id = ?`, [value]);
            return result.length !== 0;
        });
    }),
    available: z.coerce.number().min(0),
});

export const userSchema = z.object({
    id: z.string().optional(),
    username: z.string().min(4).max(25),
    password: z.string().min(8).max(255),
    is_admin: z.number().min(0).max(1).default(0),
});

export const cartProductSchema = z.object({
    id: z.coerce
        .number()
        .min(1)
        .refine(
            async (value) => (await mysqlQueryTableByID({ table: "cart_product", id: value, fields: 1 })).length !== 0,
            { message: "Cart Product does not exist." },
        )
        .optional(),
    cart_id: z.coerce
        .number()
        .min(1)
        .refine(async (value) => (await mysqlQueryTableByID({ table: "cart", id: value, fields: 1 })).length !== 0, {
            message: "Cart does not exist.",
        }),
    product_id: z.coerce
        .number()
        .min(1)
        .refine(async (value) => (await mysqlQueryTableByID({ table: "product", id: value, fields: 1 })).length !== 0, {
            message: "Product does not exist.",
        }),
    amount: z.coerce.number().min(1),
});

export const orderSchema = z.object({
    id: z.coerce
        .number()
        .min(1)
        .refine(async (value) => (await mysqlQueryTableByID({ table: "order", id: value, fields: 1 })).length !== 0, {
            message: "Cart Product does not exist.",
        })
        .optional(),
    user_id: z.string().nullable(),
    product_id: z.number().nullable(),
    amount: z.number().min(1),
    date_created: z.date().optional(),
    archive: z
        .string()
        .transform<Record<string, any>>((value, ctx) => {
            try {
                return JSON.parse(value);
            } catch (error) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Error parsing archive.",
                });
                return z.NEVER;
            }
        })
        .optional(),
    shipping_name: z.string().min(1).max(50),
    shipping_address_primary: z.string().min(1).max(255),
    shipping_address_secondary: z.string().max(255).default(""),
    shipping_city: z.string().min(1).max(100),
    shipping_state: z.string().min(1).max(100),
    shipping_zip: z.string().min(1).max(50),
    shipping_country: z.string().min(1).max(100),
    status: z.enum(["pending", "shipping", "completed", "canceled", "refunded"]).default("pending"),
});
