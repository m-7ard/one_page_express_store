import { Request, Response } from "express";
import { dbOperation, mysqlGetOrThrow, mysqlQueryTableByID, routeWithErrorHandling } from "../../backend/utils.js";
import { Order, OrderShipping } from "../../backend/managers.js";
import { orderSerializer, orderShippingSerializer } from "../../backend/serializers.js";
import { DatabaseOrder, DatabaseOrderShipping } from "../../backend/database_types.js";
import { orderSchema, orderShippingSchema } from "../../backend/schemas.js";

const confirm_shipping = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null || user.is_admin === false) {
        response.status(403).send();
        return;
    }

    const { id } = request.params;
    const validation = await orderShippingSchema
        .required({
            order_id: true,
        })
        .omit({
            date_created: true,
            id: true,
        })
        .safeParseAsync({
            order_id: id,
            ...request.body,
        });

    if (!validation.success) {
        response.status(400).json(validation.error.flatten());
        return;
    }

    const cleanedData = validation.data;

    const shippingInsertId = await OrderShipping.create(validation.data);
    await Order.update({
        id: cleanedData.order_id,
        status: "shipping",
    });

    const [updatedOrder] = await mysqlQueryTableByID<DatabaseOrder>({ table: "_order", id: cleanedData.order_id });
    const [orderShipping] = await mysqlQueryTableByID({ table: "order_shipping", id: shippingInsertId });
    response.status(200).json({
        order: orderSerializer.parse(updatedOrder),
        orderShipping: orderShippingSerializer.parse(orderShipping),
    });
});

export default confirm_shipping;
