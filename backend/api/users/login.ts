import { z } from "zod";
import { Request, Response } from "express";
import mysql from "mysql2/promise";
import { DatabaseUser, pool } from "../../lib/db.js";
import { dbOperation } from "../../backend/utils.js";
import { Argon2id } from "oslo/password";
import { generateId } from "lucia";
import { lucia } from "../../lib/auth.js";
import { userSerializer } from "../../backend/serializers.js";

const schema = z
    .object({
        username: z.string().min(4).max(25),
        password: z.string().min(8).max(255),
    })
    .refine(
        async ({ username, password }) =>
            await dbOperation(async (connection) => {
                const [userQuery, fields] = await connection.execute<DatabaseUser[]>(
                    "SELECT * FROM user WHERE username = ?",
                    [username],
                );
                const [user] = userQuery;
                if (user == null) {
                    return false;
                }
                const validPassword = await new Argon2id().verify(user.hashed_password, password);
                return validPassword;
            }),
        { message: "Incorrect username or password." },
    );

export default async function login(request: Request, response: Response) {
    if (response.locals.session) {
        response.status(200).send();
        return;
    }

    await dbOperation(async (connection) => {
        const validation = await schema.safeParseAsync(request.body);
        if (validation.success === true) {
            const [userQuery, fields] = await connection.execute<DatabaseUser[]>(
                "SELECT * FROM user WHERE username = ?",
                [request.body.username],
            );
            const [user] = userQuery;

            const session = await lucia.createSession(user.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);
            response.appendHeader("Set-Cookie", sessionCookie.serialize());

            response.status(201).json(userSerializer.parse(user));
        } else {
            response.status(400).json(validation.error.flatten());
        }
    });
}
