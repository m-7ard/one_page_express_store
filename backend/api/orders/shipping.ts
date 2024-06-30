import { Request, Response } from "express";
import { dbOperation, mysqlGetOrThrow, routeWithErrorHandling } from "../../backend/utils.js";
import { DatabaseOrder, DatabaseOrderShipping } from "../../backend/database_types.js";
import { orderShippingSerializer } from "../../backend/serializers.js";

const shipping = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null) {
        response.status(403).send();
        return;
    }

    const { id } = request.params;
    await dbOperation(async (connection) => {
        const order = await mysqlGetOrThrow<DatabaseOrder>(
            connection.execute(`SELECT * FROM _order WHERE id = ?`, [id]),
        );

        if (order.user_id !== user.id && !user.is_admin) {
            response.status(403).send();
            return;
        }

        const orderShipping = await mysqlGetOrThrow<DatabaseOrderShipping>(
            connection.execute(`SELECT * FROM order_shipping WHERE order_id = ?`, [id]),
        );

        response.status(200).json(orderShippingSerializer.parse(orderShipping));
    });
});

export default shipping;
