import { Request, Response } from "express";
import { DatabaseCartProduct } from "../../backend/database_types.js";
import { cartProductSchema } from "../../backend/schemas.js";
import { dbOperation, mysqlGetQuery, routeWithErrorHandling } from "../../backend/utils.js";
import { CartProduct } from "../../backend/managers.js";
import { z } from "zod";

const update_products = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null) {
        response.status(403).send();
        return;
    }

    await dbOperation(async (connection) => {
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

        const schema = cartProductSchema
            .partial()
            .required({ id: true })
            .refine(
                ({ id }) => {
                    return cartProducts.find((cp) => cp.id === id) != null;
                },
                { message: "Product is not in cart." },
            );

        const failedValidations: Record<string, z.typeToFlattenedError<z.output<typeof schema>>> = {};
        const successfulValidations: Array<z.output<typeof schema>> = [];
        await Promise.all(
            (request.body as Array<z.input<typeof schema>>).map(async (data) => {
                const validation = await schema.safeParseAsync(data);
                if (validation.success) {
                    successfulValidations.push(validation.data);
                    return;
                }

                failedValidations[data.id] = validation.error.flatten();
            }),
        );

        if (Object.keys(failedValidations).length > 0) {
            response.status(400).json(failedValidations);
            return;
        }

        await Promise.all(
            successfulValidations.map(async (data) => {
                return CartProduct.update(data);
            }),
        );

        response.status(200).send();
    });
});

export default update_products;
