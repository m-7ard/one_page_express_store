import { z } from "zod";
import { Request, Response } from "express";
import { DatabaseUser, pool } from "../../lib/db.js";
import { dbOperation } from "../../backend/utils.js";
import { Argon2id } from "oslo/password";
import { generateId } from "lucia";
import { lucia } from "../../lib/auth.js";
import mysql from "mysql2/promise";
import { userSerializer } from "../../backend/serializers.js";

const schema = z.object({
    username: z
        .string()
        .min(4)
        .max(25)
        .refine(
            async (value) =>
                await dbOperation(async (connection) => {
                    const [userQuery, fields] = await connection.execute<DatabaseUser[]>(
                        "SELECT id FROM user WHERE username = ?",
                        [value],
                    );
                    return userQuery.length === 0;
                }),
            { message: "Username is already taken" },
        ),
    password: z.string().min(8).max(255),
});

export default async function register(request: Request, response: Response) {
    let connection: mysql.PoolConnection | null = null;

    try {
        connection = await pool.getConnection();
        const validation = await schema.safeParseAsync(request.body);
        if (validation.success === true) {
            const cleanedData = validation.data;
            const hashedPassword = await new Argon2id().hash(cleanedData.password);
            const userId = generateId(15);
            await connection.query("INSERT INTO user (id, username, hashed_password) VALUES (?, ?, ?)", [
                userId,
                cleanedData.username,
                hashedPassword,
            ]);

            const session = await lucia.createSession(userId, {});
            const sessionCookie = lucia.createSessionCookie(session.id);
            response.appendHeader("Set-Cookie", sessionCookie.serialize());

            const [userQuery, fields] = await connection.execute<DatabaseUser[]>("SELECT * FROM user WHERE id = ?", [userId]);
            const [user] = userQuery;

            response.status(201).json(userSerializer.parse(user));
        } else {
            response.status(400).json(validation.error.flatten());
        }
    } finally {
        connection?.release();
    }
}
