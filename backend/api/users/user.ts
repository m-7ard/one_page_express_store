import { NextFunction, Request, Response } from "express";
import { cartSerializer } from "../../backend/serializers.js";
import { dbOperation, mysqlGetOrThrow, routeWithErrorHandling } from "../../backend/utils.js";
import { DatabaseCart } from "../../backend/database_types.js";

const user = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null) {
        response.status(403).send();
        return;
    }

    await dbOperation(async (connection) => {
        const cart = await mysqlGetOrThrow<DatabaseCart>(
            connection.execute("SELECT * FROM cart WHERE user_id = ?", [user.id]),
        );

        response.status(200).json({
            user: user,
            cart: await cartSerializer.parseAsync(cart),
        });
    });
});

export default user;
