import { Request, Response } from "express";
import { DatabaseCart } from "../../backend/database_types.js";
import { cartSerializer } from "../../backend/serializers.js";
import {
    dbOperation,
    mysqlGetOrThrow,
    routeWithErrorHandling,
} from "../../backend/utils.js";

const list_products = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null) {
        response.status(403).send();
        return;
    }

    return await dbOperation(async (connection) => {
        const cart = await mysqlGetOrThrow<DatabaseCart>(
            connection.execute("SELECT * FROM cart WHERE user_id = ?", [user.id]),
        );
        response.status(201).json(await cartSerializer.parseAsync(cart));
    });
});

export default list_products;
