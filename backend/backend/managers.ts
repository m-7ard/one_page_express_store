import { z } from "zod";
import { DatabaseUser } from "./database_types.js";
import { cartProductSchema, productSchema, userSchema } from "./schemas.js";
import {
    dbOperation,
    mysqlGetOrThrow,
    mysqlGetQuery,
    mysqlPrepareWithPlaceholders,
    mysqlQueryTableByID,
} from "./utils.js";
import { ResultSetHeader } from "mysql2";
import { Argon2id } from "oslo/password";
import { generateId } from "lucia";
import { nanoid } from "nanoid";
import { BASE_DIR } from "./settings.js";
import { rm, writeFile } from "fs/promises";
import { productSerializer } from "./serializers.js";

interface UserUpdate extends Partial<z.output<typeof userSchema>> {
    id: NonNullable<z.output<typeof userSchema.shape.id>>;
}

interface UserCreate extends z.output<typeof userSchema> {}

interface UserDelete extends Partial<z.output<typeof userSchema>> {
    id: NonNullable<z.output<typeof userSchema.shape.id>>;
}

export const User = {
    create: async (data: UserCreate) => {
        const hashedPassword = await new Argon2id().hash(data.password);
        const userId = generateId(15);
        await dbOperation(async (connection) => {
            const userInsert = await connection.execute<ResultSetHeader>({
                sql: "INSERT INTO user (id, username, hashed_password, is_admin) VALUES (:id, :username, :hashed_password, :is_admin)",
                values: {
                    id: userId,
                    username: data.username,
                    hashed_password: hashedPassword,
                    is_admin: data.is_admin,
                },
                namedPlaceholders: true,
            });
            const cartInsert = await connection.execute<ResultSetHeader>("INSERT INTO cart (user_id) VALUES (?)", [
                userId,
            ]);
        });

        return userId;
    },
    update: async (data: UserUpdate) => {
        const hashedPassword = data.password == null ? null : await new Argon2id().hash(data.password);

        await dbOperation(async (connection) => {
            await mysqlPrepareWithPlaceholders({
                connection,
                sql: `
                    UPDATE user 
                        SET
                            username = IF(:username IS NULL, username, :username),
                            hashed_password = IF(:hashed_password IS NULL, hashed_password, :hashed_password),
                            is_admin = IF(:is_admin IS NULL, is_admin, :is_admin)
                        WHERE
                            id = :id
                `,
                values: {
                    id: data.id,
                    username: data.username ?? null,
                    hashed_password: hashedPassword ?? null,
                    is_admin: data.is_admin ?? null,
                },
            });
        });
    },
    delete: async ({ id }: UserDelete) => {
        await dbOperation(async (connection) => {
            await connection.execute(`DELETE FROM user WHERE id = ?`, [id]);
        });
    },
};

interface ProductCreate extends z.output<typeof productSchema> {}

interface ProductUpdate extends Partial<z.output<typeof productSchema>> {
    id: NonNullable<z.output<typeof productSchema.shape.id>>;
}

interface ProductDelete extends Partial<z.output<typeof productSchema>> {
    id: NonNullable<z.output<typeof productSchema.shape.id>>;
}

export const Product = {
    create: async (data: ProductCreate) => {
        let savedFileNames: {
            index: number;
            fileName: string;
        }[] = [];

        await Promise.all(
            data.newImages.map(async ({ index, file }) => {
                const id = nanoid();
                const fileName = `${id}-${file.originalname}`;
                try {
                    await writeFile(`${BASE_DIR}/backend/media/${fileName}`, file.buffer);
                    savedFileNames.push({ index, fileName });
                } catch (error) {
                    console.log(`Error trying to save ${fileName}`);
                }
            }),
        );

        const fileNames = savedFileNames.sort((a, b) => a.index - b.index).map(({ fileName }) => fileName);

        const { insertId } = await dbOperation(async (connection) => {
            const [result] = await connection.execute<ResultSetHeader>({
                sql: `
                    INSERT INTO product 
                        SET
                            name = :name,
                            description = :description,
                            price = :price,
                            kind = :kind,
                            specification = :specification,
                            images = :images,
                            user_id = :user_id
                `,
                values: {
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    kind: data.kind,
                    specification: JSON.stringify(data.specification),
                    images: JSON.stringify(fileNames),
                    user_id: data.user_id,
                },
                namedPlaceholders: true,
            });

            return result;
        });

        return insertId;
    },
    update: async (data: ProductUpdate) => {
        let fileNames: string[];
        return await dbOperation(async (connection) => {
            if (data.existingImages != null) {
                const oldProduct = productSerializer.parse(
                    await mysqlGetOrThrow<DatabaseUser>(
                        connection.execute(`SELECT * FROM product WHERE id = ?`, [data.id]),
                    ),
                );
                const newExistingImages =
                    data.existingImages == null
                        ? oldProduct.images
                        : data.existingImages.map(({ fileName }) => fileName);
                const filesForDeletion = oldProduct.images.filter((fileName) => !newExistingImages.includes(fileName));

                await Promise.all(
                    filesForDeletion.map(async (image) => {
                        try {
                            await rm(`media/${image}`);
                        } catch (error) {
                            console.log(`Error trying to delete ${image}.`);
                        }
                    }),
                );

                const savedFileNames =
                    data.newImages == null
                        ? []
                        : await Promise.all(
                              data.newImages.map(async ({ index, file }) => {
                                  const id = nanoid();
                                  const fileName = `${id}-${file.originalname}`;
                                  await writeFile(`${BASE_DIR}/backend/media/${fileName}`, file.buffer);
                                  return { index, fileName };
                              }),
                          );

                fileNames = [...savedFileNames, ...data.existingImages]
                    .sort((a, b) => a.index - b.index)
                    .map(({ fileName }) => fileName);
            }

            const [result] = await connection.execute<ResultSetHeader>({
                sql: `
                    UPDATE product 
                        SET
                            name = IF (:name IS NULL, name, :name),
                            description = IF (:description IS NULL, description, :description),
                            price = IF (:price IS NULL, price, :price),
                            kind = IF (:kind IS NULL, kind, :kind),
                            specification = IF (:specification IS NULL, specification, :specification),
                            images = IF (:images IS NULL, images, :images),
                            user_id = IF (:user_id IS NULL, user_id, :user_id)
                    WHERE
                        id = :id
                `,
                values: {
                    id: data.id,
                    name: data.name ?? null,
                    description: data.description ?? null,
                    price: data.price ?? null,
                    kind: data.kind ?? null,
                    specification: data.specification == null ? null : JSON.stringify(data.specification),
                    images: fileNames == null ? null : JSON.stringify(fileNames),
                    user_id: data.user_id ?? null,
                },
                namedPlaceholders: true,
            });

            return result;
        });
    },
};

interface CartProductCreate extends z.output<typeof cartProductSchema> {}
interface CartProductUpdate extends Partial<z.output<typeof cartProductSchema>> {
    id: NonNullable<z.output<typeof cartProductSchema.shape.id>>;
}
interface CartProductDelete extends Partial<z.output<typeof cartProductSchema>> {
    id: NonNullable<z.output<typeof cartProductSchema.shape.id>>;
}

export const CartProduct = {
    create: async (data: CartProductCreate) => {
        const { insertId } = await dbOperation(async (connection) => {
            const [result] = await connection.execute<ResultSetHeader>({
                sql: "INSERT INTO cart_product (product_id, cart_id, amount) VALUES (:product_id, :cart_id, :amount)",
                values: {
                    cart_id: data.cart_id,
                    product_id: data.product_id,
                    amount: data.amount,
                },
                namedPlaceholders: true,
            });

            return result;
        });
        return insertId;
    },
    update: async (data: CartProductUpdate) => {
        return await dbOperation(async (connection) => {
            const [result] = await connection.execute<ResultSetHeader>({
                sql: `
                    UPDATE product 
                        SET
                            amount = IF (:amount IS NULL, amount, :amount),
                    WHERE
                        id = :id
                `,
                values: {
                    id: data.id,
                    amount: data.amount ?? null,
                },
                namedPlaceholders: true,
            });

            return result;
        });
    },
    delete: async (data: CartProductDelete) => {
        await dbOperation(async (connection) => {
            await connection.execute(`DELETE FROM cart_product WHERE id = ?`, [data.id]);
        });
    },
};
