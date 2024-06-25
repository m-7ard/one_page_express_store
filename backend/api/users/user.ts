import { NextFunction, Request, Response } from "express";
import { cartSerializer, orderSerializer } from "../../backend/serializers.js";
import { dbOperation, mysqlGetOrThrow, mysqlGetQuery, routeWithErrorHandling } from "../../backend/utils.js";
import { DatabaseCart, DatabaseOrder } from "../../backend/database_types.js";
import { z } from "zod";

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

        const orders = await mysqlGetQuery<DatabaseOrder>(
            connection.execute('SELECT * FROM _order WHERE user_id = ?', [user.id])
        );

        response.status(200).json({
            user: user,
            cart: await cartSerializer.parseAsync(cart),
            orders: z.array(orderSerializer).parse(orders),
        });
    });
});

export default user;
