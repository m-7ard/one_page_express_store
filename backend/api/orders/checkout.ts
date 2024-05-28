import { ResultSetHeader } from "mysql2/promise";
import { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import { BASE_DIR } from "../../backend/settings.js";
import { DatabaseCart, DatabaseCartProduct, DatabaseOrder, DatabaseProduct } from "../../backend/database_types.js";
import {
    cartProductSerializer,
    cartSerializer,
    orderSerializer,
    productSerializer,
} from "../../backend/serializers.js";
import { cartProductSchema, orderSchema, productSchema } from "../../backend/schemas.js";
import { dbOperation, mysqlGetOrThrow, mysqlGetQuery, routeWithErrorHandling } from "../../backend/utils.js";
import { Order, Product } from "../../backend/managers.js";
import { z } from "zod";

const checkout = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null || user.is_admin === false) {
        response.status(403).send();
        return;
    }

    await dbOperation(async (connection) => {
        const cartProducts = await mysqlGetQuery<DatabaseCartProduct & { product_available: number }>(
            connection.query(
                `
                SELECT cart_product.*, product.available as product_available
                FROM 
                    cart_product 
                    LEFT JOIN cart ON cart_product.cart_id = cart.id
                    LEFT JOIN product ON cart_product.product_id = product.id
                WHERE 
                    cart.user_id = ?
                `,
                [user.id],
            ),
        );

        const checkoutSchema = z.object({
            cartProducts: z.record(
                cartProductSchema.required().superRefine(async (value, ctx) => {
                    const cartProduct = cartProducts.find(({ id }) => id === value.id);
                    if (cartProduct == null) {
                        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid Cart Item." });
                        return z.NEVER;
                    }

                    if (value.amount > cartProduct.product_available) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: "Amount is bigger than available amount.",
                        });
                        return z.NEVER;
                    }
                }),
            ),
            formData: orderSchema.pick({
                shipping_name: true,
                shipping_address_primary: true,
                shipping_address_secondary: true,
                shipping_city: true,
                shipping_state: true,
                shipping_zip: true,
                shipping_country: true,
            }),
        });

        const body: {
            cartProducts: Array<z.output<typeof cartSerializer>>;
            formData: z.input<typeof checkoutSchema.shape.formData>;
        } = request.body;

        const validation = await checkoutSchema.safeParseAsync({
            cartProducts: body.cartProducts.reduce((acc, cp) => {
                return { ...acc, [cp.id]: cp };
            }, {}),
            formData: body.formData,
        });

        if (validation.success === false) {
            response.status(400).send(validation.error.format());
        } else {
            const insertIds = await Promise.all(
                Object.values(validation.data.cartProducts).map(async ({ product_id, amount }) => {
                    return await Order.create({
                        user_id: user.id,
                        product_id,
                        amount,
                        status: "pending",
                        ...validation.data.formData,
                    });
                }),
            );
            console.log(insertIds);
            const orders = await mysqlGetQuery<DatabaseOrder>(
                connection.execute(`SELECT * FROM _order WHERE JSON_CONTAINS(?, id, '$') = 1`, [
                    JSON.stringify([insertIds[0]]),
                ]),
            );
            console.log(orders, insertIds);

            response.status(201).json(z.array(orderSerializer).parse(orders));
        }
    });
});

export default checkout;
