import { z } from "zod";
import { access } from "fs/promises";
import { BASE_DIR } from "./settings.js";
import { dbOperation, mysqlGetOrThrow, mysqlGetQuery } from "./utils.js";
import { RowDataPacket } from "mysql2";
import { PRODUCT } from "./constants.js";
import { DatabaseUser } from "./database_types.js";

export const productSchema = z.object({
    id: z.coerce.number().refine(async (value) => {
        return await dbOperation(async (connection) => {
            const [result] = await connection.execute<RowDataPacket[]>(`SELECT 1 FROM product WHERE id = ?`, [value]);
            return result.length === 1;
        });
    }).optional(),
    name: z.string().min(1).max(50),
    description: z.string().max(512),
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
        .max(PRODUCT.MAX_IMAGES_LENGTH, { message: `Cannot upload more than ${PRODUCT.MAX_IMAGES_LENGTH} files.` }),
    existingImages: z.array(
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
    ),
    specification: z.string().transform((value, ctx) => {
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
});

export const userSchema = z.object({
    id: z.string().optional(),
    username: z
        .string()
        .min(4)
        .max(25),
    password: z.string().min(8).max(255),
    is_admin: z
        .number()
        .min(0)
        .max(1)
        .default(0),
});