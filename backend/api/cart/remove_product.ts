import { Request, Response } from "express";
import { DatabaseCart, DatabaseCartProduct } from "../../backend/database_types.js";
import { cartSerializer } from "../../backend/serializers.js";
import { dbOperation, mysqlGetOrThrow, routeWithErrorHandling } from "../../backend/utils.js";
import { CartProduct } from "../../backend/managers.js";

const remove_product = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null) {
        response.status(403).send();
        return;
    }

    return await dbOperation(async (connection) => {
        const cartProduct = await mysqlGetOrThrow<DatabaseCartProduct>(
            connection.execute(
                `
                SELECT cart_product.* 
                    FROM 
                        cart_product LEFT JOIN cart
                    ON
                        cart_product.cart_id = cart.id
                    WHERE cart.user_id = ? AND cart_product.product_id = ?
                `,
                [user.id, request.params.id],
            ),
        );
        await CartProduct.delete(cartProduct);
        response.status(200).send();
    });
});

export default remove_product;
