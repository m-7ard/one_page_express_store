import { Request, Response } from "express";
import { DatabaseCartProduct } from "../../backend/database_types.js";
import { cartProductSchema } from "../../backend/schemas.js";
import {
    dbOperationWithRollback,
    mysqlGetQuery,
    routeWithErrorHandling,
} from "../../backend/utils.js";
import { CartProduct } from "../../backend/managers.js";
import { z } from "zod";

const update_products = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null) {
        response.status(403).send();
        return;
    }

    return await dbOperationWithRollback(async (connection) => {
        const cartProducts = await mysqlGetQuery<DatabaseCartProduct>(
            connection.query(
                `
                SELECT cart_product.* 
                    FROM 
                        cart_product LEFT JOIN cart
                    ON 
                        cart_product.cart_id = cart.id
                    WHERE cart.user_id = ?
            `,
                [user.id],
            ),
        );
        const validation = await z
            .array(
                cartProductSchema
                    .partial()
                    .required({
                        id: true,
                    })
                    .refine(({ id }) => {
                        return cartProducts.find((cp) => cp.id === id) != null;
                    }, { message: "Product is not in cart." }),
            )
            .safeParseAsync(request.body);
            
        if (!validation.success) {
            response.status(400).json(validation.error.flatten());
            return;
        }

        await Promise.all(
            validation.data.map(async (data) => {
                await CartProduct.update(data);
            }),
        );

        response.status(200).send();
    });
});

export default update_products;
