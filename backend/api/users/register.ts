import { z } from "zod";
import { Request, Response } from "express";
import { DatabaseUser, pool } from "../../lib/db.js";
import { dbOperation, mysqlGetOrThrow } from "../../backend/utils.js";
import { Argon2id } from "oslo/password";
import { generateId } from "lucia";
import { lucia } from "../../lib/auth.js";
import mysql from "mysql2/promise";
import { userSerializer } from "../../backend/serializers.js";
import { userSchema } from "../../backend/schemas.js";
import { User } from "../../backend/managers.js";

const schema = z.object({
    ...userSchema.shape,
    username: userSchema.shape.username.refine(
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
});

export default async function register(request: Request, response: Response) {
    if (response.locals.session) {
        response.status(403).json({
            formErrors: ["You are currently logged in. Please log out before registering a new account."],
        } as z.typeToFlattenedError<string, string>);
        return;
    }

    const validation = await schema.safeParseAsync(request.body);

    if (validation.success === true) {
        const cleanedData = validation.data;
        const id = await User.create(cleanedData);
        const session = await lucia.createSession(id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        response.appendHeader("Set-Cookie", sessionCookie.serialize());

        const user = await dbOperation(async (connection) => {
            return await mysqlGetOrThrow<DatabaseUser>(connection.execute("SELECT * FROM user WHERE id = ?", [id]));
        });

        response.status(201).json(userSerializer.parse(user));
    } else {
        response.status(400).json(validation.error.flatten());
    }
}
