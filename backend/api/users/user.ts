import { NextFunction, Request, Response } from "express";
import { cartSerializer } from "../../backend/serializers.js";
import { dbOperation, mysqlGetOrThrow } from "../../backend/utils.js";
import { DatabaseCart } from "../../backend/database_types.js";

export default async function user(request: Request, response: Response, next: NextFunction) {
    const user = response.locals.user;
    if (user == null) {
        return response.status(403).send();
    }

    return await dbOperation(async (connection) => {
        const cart = await mysqlGetOrThrow<DatabaseCart>(
            connection.execute("SELECT * FROM cart WHERE user_id = ?", [user.id]),
        );

        response.status(200).json({
            user: user,
            cart: await cartSerializer.parseAsync(cart),
        });

        return;
    });
}
