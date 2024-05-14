import { z } from "zod";
import { Request, Response } from "express";
import { DatabaseUser } from "../../lib/db.js";
import { dbOperationWithRollback, mysqlGetOrThrow, routeWithErrorHandling } from "../../backend/utils.js";
import { lucia } from "../../lib/auth.js";
import { cartSerializer, userSerializer } from "../../backend/serializers.js";
import { userSchema } from "../../backend/schemas.js";
import { User } from "../../backend/managers.js";
import { DatabaseCart } from "../../backend/database_types.js";

const schema = userSchema.extend({
    username: userSchema.shape.username.refine(
        async (value) =>
            await dbOperationWithRollback(async (connection) => {
                const [userQuery, fields] = await connection.execute<DatabaseUser[]>(
                    "SELECT id FROM user WHERE username = ?",
                    [value],
                );
                return userQuery.length === 0;
            }),
        { message: "Username is already taken" },
    ),
});

const register = routeWithErrorHandling(async function register(request: Request, response: Response) {
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

        return await dbOperationWithRollback(async (connection) => {
            const user = await mysqlGetOrThrow<DatabaseUser>(
                connection.execute("SELECT * FROM user WHERE id = ?", [id]),
            );
            const cart = await mysqlGetOrThrow<DatabaseCart>(
                connection.execute("SELECT * FROM cart WHERE user_id = ?", [user.id]),
            );

            response.status(201).json({
                user: userSerializer.parse(user),
                cart: await cartSerializer.parseAsync(cart),
            });
        });
    } else {
        response.status(400).json(validation.error.flatten());
        return;
    }
});

export default register;
