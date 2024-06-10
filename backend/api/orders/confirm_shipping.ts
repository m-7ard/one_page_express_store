import { Request, Response } from "express";
import { dbOperation, mysqlGetOrThrow, routeWithErrorHandling } from "../../backend/utils.js";
import { Order } from "../../backend/managers.js";
import { orderSerializer } from "../../backend/serializers.js";
import { DatabaseOrder } from "../../backend/database_types.js";
import { orderSchema } from "../../backend/schemas.js";

const confirm_shipping = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null || user.is_admin === false) {
        response.status(403).send();
        return;
    }

    const { id } = request.params;
    const validation = await orderSchema
        .partial()
        .required({
            id: true,
            status: true,
        })
        .safeParseAsync({ id, status: "shipping" });

    if (!validation.success) {
        console.log(validation.error.flatten())
        response.status(400).json(validation.error.flatten());
        return;
    }

    await Order.update(validation.data);
    await dbOperation(async (connection) => {
        const updatedOrder = await mysqlGetOrThrow<DatabaseOrder>(
            connection.execute(`SELECT * FROM _order WHERE id = ?`, [id]),
        );
        response.status(200).json(orderSerializer.parse(updatedOrder));
    });
});

export default confirm_shipping;
