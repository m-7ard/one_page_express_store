import { ResultSetHeader } from "mysql2/promise";
import { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import { BASE_DIR } from "../../backend/settings.js";
import { DatabaseCart, DatabaseCartProduct, DatabaseProduct } from "../../backend/database_types.js";
import { cartProductSerializer, productSerializer } from "../../backend/serializers.js";
import { cartProductSchema, productSchema } from "../../backend/schemas.js";
import { getImages } from "./_utils.js";
import {
    dbOperation,
    mysqlGetOrNull,
    mysqlGetOrThrow,
    mysqlGetQuery,
    mysqlQueryTableByID,
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

    return await dbOperation(async (connection) => {
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
