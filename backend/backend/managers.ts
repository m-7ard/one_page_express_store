import { z } from "zod";
import { DatabaseUser } from "./database_types.js";
import { productSchema, userSchema } from "./schemas.js";
import { dbOperation, mysqlGetQuery, mysqlPrepareWithPlaceholders } from "./utils.js";
import { ResultSetHeader } from "mysql2";
import { Argon2id } from "oslo/password";
import { generateId } from "lucia";
import { nanoid } from "nanoid";
import { BASE_DIR } from "./settings.js";
import { rm, writeFile } from "fs/promises";

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
                    user_id: data.user_id
                },
                namedPlaceholders: true,
            });

            return result;
        });

        return insertId;
    },
};