import { Request, Response } from "express";
import { dbOperation, mysqlGetOrThrow, mysqlQueryTableByID, routeWithErrorHandling } from "../../backend/utils.js";
import { Order } from "../../backend/managers.js";
import { orderSerializer } from "../../backend/serializers.js";
import { DatabaseOrder } from "../../backend/database_types.js";
import { orderSchema } from "../../backend/schemas.js";
import { z } from "zod";

const confirm_completed = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null) {
        response.status(403).send();
        return;
    }

    const { id } = request.params;
    const validation = await orderSchema
        .partial()
        .required({
            id: true,
        })
        .transform(async (values, ctx) => {
            const [order] = await mysqlQueryTableByID<DatabaseOrder>({ table: "_order", id: values.id });
            if (user.is_admin === false && user.id !== order.user_id) {
                ctx.addIssue({ code: "custom", message: "Request user does not match order user." });
                return z.NEVER;
            }

            return {
                ...values,
                status: (user.is_admin ? "presumed_completed" : "completed") as z.output<typeof orderSchema.shape.status>,
            };
        })
        .safeParseAsync({ id });

    if (!validation.success) {
        console.log(validation.error.flatten());
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

export default confirm_completed;
