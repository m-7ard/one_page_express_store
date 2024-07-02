import { Request, Response } from "express";
import { DatabaseCartProduct, DatabaseOrder, DatabaseProduct } from "../../backend/database_types.js";
import {
    cartProductSerializer,
    cartSerializer,
    orderSerializer,
    productSerializer,
} from "../../backend/serializers.js";
import { cartProductSchema, orderSchema, productSchema } from "../../backend/schemas.js";
import { dbOperation, mysqlGetQuery, mysqlQueryTableByID, routeWithErrorHandling } from "../../backend/utils.js";
import { Order } from "../../backend/managers.js";
import { z } from "zod";
import { isDeepStrictEqual } from "util";


const checkout = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null || user.is_admin === false) {
        response.status(403).send();
        return;
    }

    await dbOperation(async (connection) => {
        // Fetch user cart products
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

        // Should send a user a prompt whether they want
        // to confirm the updated product data or cancel
        let promptUpdatedCartProducts = false; // used as a flag in cartProductDbProductValidator

        // Validators
        const cartProductDbProductValidator = productSchema
            .required()
            .pick({ id: true })
            .passthrough()
            .refine(
                async (value) => {
                    const { id, images, specification } = value as z.output<typeof productSerializer>;
                    const [dbProduct] = await mysqlQueryTableByID<DatabaseProduct>({
                        table: "product",
                        id,
                    });
                    const serializedDbProduct = productSerializer.parse(dbProduct);
                    const checkFields: Array<keyof typeof productSerializer.shape> = [
                        "description",
                        "kind",
                        "price",
                        "name",
                    ];

                    const upTpDate =
                        checkFields.every((field) => serializedDbProduct[field] === value[field]) &&
                        isDeepStrictEqual(images, serializedDbProduct.images) &&
                        isDeepStrictEqual(specification, serializedDbProduct.specification);

                    if (!promptUpdatedCartProducts && !upTpDate) {
                        promptUpdatedCartProducts = true;
                    }

                    return upTpDate;
                },
                { message: "Product data is outdated." },
            );

        const cartProductValidator = z.record(
            z
                .object({
                    id: cartProductSchema.required().shape.id.refine(
                        (value) => {
                            return cartProducts.find(({ id }) => value === id) ?? false;
                        },
                        { message: "Product is not in cart" },
                    ),
                    amount: cartProductSchema.shape.amount,
                    product: cartProductDbProductValidator,
                })
                .refine(async ({ product, amount }) => {
                    const [dbProduct] = await mysqlQueryTableByID<DatabaseProduct>({
                        table: "product",
                        id: product.id,
                    });

                    return dbProduct.available >= amount;
                }, "Amount is bigger than products available."),
        );

        const formDataValidator = orderSchema.pick({
            shipping_name: true,
            shipping_address_primary: true,
            shipping_address_secondary: true,
            shipping_city: true,
            shipping_state: true,
            shipping_zip: true,
            shipping_country: true,
        });

        // Validation
        const body: {
            cartProducts: Array<z.output<typeof cartSerializer>>;
            formData: z.input<typeof formDataValidator>;
        } = request.body;

        const cartProductById = body.cartProducts.reduce<Record<number, (typeof body)["cartProducts"][number]>>(
            (acc, cp) => {
                acc[cp.id] = cp;
                return acc;
            },
            {},
        );

        const cartProductValidation = await cartProductValidator.safeParseAsync(cartProductById);

        const formDataValidation = formDataValidator.safeParse(body.formData);

        // Response
        if (cartProductValidation.success === false || formDataValidation.success === false) {
            const errors: Record<string, unknown> = {
                promptUpdatedCartProducts,
            };

            if (errors.promptUpdatedCartProducts) {
                errors.updatedCartProducts = await z
                    .array(cartProductSerializer)
                    .parseAsync(cartProducts.filter(({ id }) => cartProductById.hasOwnProperty(id)));
            }

            if (!cartProductValidation.success) {
                errors.cartProducts = cartProductValidation.error.flatten();
            }

            if (!formDataValidation.success) {
                errors.formData = formDataValidation?.error.flatten();
            }

            response.status(400).json(errors);
        } else {
            const insertIds = await Promise.all(
                Object.values(cartProductValidation.data).map(async ({ product, amount }) => {
                    return await Order.create({
                        user_id: user.id,
                        product_id: product.id,
                        amount,
                        status: "pending",
                        ...formDataValidation.data,
                    });
                }),
            );
            const orders = await mysqlGetQuery<DatabaseOrder>(
                connection.query(`SELECT * FROM _order WHERE id IN (${insertIds.join(", ")})`),
            );
            response.status(201).json(z.array(orderSerializer).parse(orders));
        }
    });
});

export default checkout;
