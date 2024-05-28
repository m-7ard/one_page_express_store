import { z } from "zod";
import { Request, Response } from "express";
import mysql from "mysql2/promise";
import { DatabaseUser, pool } from "../../lib/db.js";
import { dbOperation, mysqlGetOrThrow, routeWithErrorHandling } from "../../backend/utils.js";
import { Argon2id } from "oslo/password";
import { generateId } from "lucia";
import { lucia } from "../../lib/auth.js";
import { cartSerializer, userSerializer } from "../../backend/serializers.js";
import { DatabaseCart } from "../../backend/database_types.js";
import { userSchema } from "../../backend/schemas.js";

const schema = userSchema
    .pick({
        username: true,
        password: true
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

const login = routeWithErrorHandling(async function login(request: Request, response: Response) {
    await dbOperation(async (connection) => {
        if (response.locals.session) {
            const user = response.locals.user!;
            const cart = await mysqlGetOrThrow<DatabaseCart>(
                connection.execute("SELECT * FROM cart WHERE user_id = ?", [user.id]),
            );
            response.status(200).json({
                user: user,
                cart: await cartSerializer.parseAsync(cart),
            });
            return;
        }

        const validation = await schema.safeParseAsync(request.body);
        if (validation.success === true) {
            const dbUser = await mysqlGetOrThrow<DatabaseUser>(
                connection.execute("SELECT * FROM user WHERE username = ?", [request.body.username]),
            );

            const session = await lucia.createSession(dbUser.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);
            response.appendHeader("Set-Cookie", sessionCookie.serialize());

            const cart = await mysqlGetOrThrow<DatabaseCart>(
                connection.execute("SELECT * FROM cart WHERE user_id = ?", [dbUser.id]),
            );

            response.status(200).json({
                user: userSerializer.parse(dbUser),
                cart: await cartSerializer.parseAsync(cart),
            });
        } else {
            response.status(400).json(validation.error.flatten());
            return;
        }
    });
});

export default login;
