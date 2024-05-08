import { z } from "zod";
import { DatabaseUser } from "./database_types.js";
import { userSchema } from "./schemas.js";
import { dbOperation, mysqlGetQuery, mysqlPrepareWithPlaceholders } from "./utils.js";
import { ResultSetHeader } from "mysql2";
import { Argon2id } from "oslo/password";
import { generateId } from "lucia";

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
