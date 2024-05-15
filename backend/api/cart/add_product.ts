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
    dbOperationWithRollback,
    mysqlGetOrNull,
    mysqlGetOrThrow,
    mysqlQueryTableByID,
    routeWithErrorHandling,
} from "../../backend/utils.js";
import { CartProduct } from "../../backend/managers.js";

const add_product = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null) {
        response.status(403).send();
        return;
    }

    await dbOperationWithRollback(async (connection) => {
        const cart = await mysqlGetOrThrow<DatabaseCart>(
            connection.execute("SELECT * FROM cart WHERE user_id = ?", [user.id]),
        );

        const existingCartProduct = await mysqlGetOrNull<DatabaseCartProduct>(
            connection.execute(`SELECT * FROM cart_product WHERE cart_id = ? AND product_id = ?`, [
                cart.id,
                request.params.id,
            ]),
        );

        if (existingCartProduct != null) {
            return response.status(200).json(await cartProductSerializer.parseAsync(existingCartProduct));
        }

        const validation = await cartProductSchema.safeParseAsync({
            cart_id: cart.id,
            product_id: request.params.id,
            amount: request.body.amount,
        });

        if (!validation.success) {
            response.status(400).json(validation.error.flatten());
            return;
        }

        const id = await CartProduct.create(validation.data);
        const [cartProduct] = await mysqlQueryTableByID<DatabaseCartProduct>({
            table: "cart_product",
            id: id,
        });

        response.status(201).json(await cartProductSerializer.parseAsync(cartProduct));
    });
});

export default add_product;
