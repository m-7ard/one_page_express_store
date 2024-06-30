import { env } from "process";
import context, { getFromContext } from "../backend/context.js";
import {
    DatabaseCart,
    DatabaseCartProduct,
    DatabaseOrder,
    DatabaseOrderShipping,
    DatabaseProduct,
} from "../backend/database_types.js";
import { CartProduct, Order, Product } from "../backend/managers.js";
import { dbOperation, mysqlGetOrThrow, mysqlGetQuery, mysqlQueryTableByID } from "../backend/utils.js";
import { createCartProduct, createProduct, createSessionCookie, objectToFormData, test, testCase } from "./_utils.js";
import { productsMixin, usersMixin } from "./mixins.js";
import assert from "assert";
import {
    cartProductSerializer,
    cartSerializer,
    orderSerializer,
    orderShippingSerializer,
} from "../backend/serializers.js";
import { z } from "zod";
import { productSchema } from "../backend/schemas.js";
import sql, { join } from "sql-template-tag";

context.testsToRun = ["Successfully fetch order shipping data as client or admin"];

/* 
    TODO: 
        test for duplicate order shipping 
*/

testCase(async () => {
    const pool = getFromContext("pool");

    const users = await usersMixin();
    const products = await productsMixin({ users });
    const CUSTOMER_1_COOKIE = await createSessionCookie(users.CUSTOMER_1.id);
    const ADMIN_1_COOKIE = await createSessionCookie(users.ADMIN_1.id);
    const DUMMY_SHIPPING_DATA = {
        shipping_name: "sample",
        shipping_address_primary: "sample",
        shipping_address_secondary: "sample",
        shipping_city: "sample",
        shipping_state: "sample",
        shipping_zip: "sample",
        shipping_country: "sample",
    } as const;

    const ADMIN_1_CART_MIXN = async () => {
        const cart = await mysqlGetOrThrow<DatabaseCart>(
            pool.execute("SELECT * FROM cart WHERE user_id = ?", [users.ADMIN_1.id]),
        );

        const prods = await Promise.all(
            Array.from({ length: 100 }).map(async () => {
                return await createProduct({
                    name: "Test User Product",
                    description: "Test User Desc",
                    price: 999,
                    kind: "Tea",
                    specification: [
                        ["building", "tall"],
                        ["chicken", "coop"],
                    ],
                    existingImages: [],
                    user_id: users.ADMIN_2.id,
                    available: 1,
                });
            }),
        );

        const ADMIN_2__PRODUCT_1 = await createCartProduct({
            user_id: users.ADMIN_1.id,
            amount: 1,
            product_id: products.ADMIN_2__PRODUCT_1.id,
        });
        const ADMIN_2__PRODUCT_2 = await createCartProduct({
            user_id: users.ADMIN_1.id,
            amount: 1,
            product_id: products.ADMIN_2__PRODUCT_2.id,
        });

        const cartProducts = [
            ADMIN_2__PRODUCT_1,
            ADMIN_2__PRODUCT_2,
            ...(await Promise.all(
                prods.map(async (prod) => {
                    return await createCartProduct({
                        user_id: users.ADMIN_1.id,
                        amount: 1,
                        product_id: prod.id,
                    });
                }),
            )),
        ];

        const EXPECTED_CART_PRODUCTS_COUNT = cartProducts.length;

        return { cart, cartProducts, ADMIN_2__PRODUCT_1, ADMIN_2__PRODUCT_2, EXPECTED_CART_PRODUCTS_COUNT };
    };

    await test(async () => {
        const { cartProducts, EXPECTED_CART_PRODUCTS_COUNT } = await ADMIN_1_CART_MIXN();
        const response = await fetch(`http://localhost:3001/api/orders/checkout`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cartProducts: await z.array(cartProductSerializer).parseAsync(cartProducts),
                formData: DUMMY_SHIPPING_DATA,
            }),
        });

        //
        assert.strictEqual(response.status, 201);

        //
        const data = await response.json();
        assert.strictEqual(data.length, EXPECTED_CART_PRODUCTS_COUNT);

        //
        const dbCart = await mysqlGetOrThrow<DatabaseCart>(
            pool.execute("SELECT * FROM cart WHERE user_id = ?", [users.ADMIN_1.id]),
        );
        const cart = await cartSerializer.parseAsync(dbCart);
        assert.strictEqual(cart.products.length, 0);
    }, "Checkout Cart Products");

    await test(async () => {
        const { cartProducts, EXPECTED_CART_PRODUCTS_COUNT, ADMIN_2__PRODUCT_1 } = await ADMIN_1_CART_MIXN();
        cartProducts[0].amount = 10000000000;
        const response = await fetch(`http://localhost:3001/api/orders/checkout`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cartProducts: await z.array(cartProductSerializer).parseAsync(cartProducts),
                formData: DUMMY_SHIPPING_DATA,
            }),
        });

        assert.strictEqual(response.status, 400);
        const dbCart = await mysqlGetOrThrow<DatabaseCart>(
            pool.execute("SELECT * FROM cart WHERE user_id = ?", [users.ADMIN_1.id]),
        );
        const cart = await cartSerializer.parseAsync(dbCart);
        assert.strictEqual(cart.products.length, EXPECTED_CART_PRODUCTS_COUNT);
    }, "Fail To Checkout Cart Products With Invalid Amount");

    await test(async () => {
        //
        const { cartProducts, EXPECTED_CART_PRODUCTS_COUNT } = await ADMIN_1_CART_MIXN();

        //
        const productsToCheckout = await z.array(cartProductSerializer).parseAsync(cartProducts.slice(0, 2));

        //
        const [productToUpdate] = await mysqlQueryTableByID<DatabaseProduct>({
            table: "product",
            id: cartProducts[0].product_id,
        });
        productToUpdate.name = "New name abc";
        const updateData = await productSchema.required().parseAsync(productToUpdate);
        await Product.update(updateData);

        //
        const response = await fetch(`http://localhost:3001/api/orders/checkout`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cartProducts: productsToCheckout,
                formData: DUMMY_SHIPPING_DATA,
            }),
        });

        //
        assert.strictEqual(response.status, 400);

        //
        const errors = await response.json();
        assert.strictEqual(errors.promptUpdatedCartProducts, true);
        assert.strictEqual(errors.updatedCartProducts.length, 2);

        //
        const query = sql`
            SELECT * FROM cart_product 
                WHERE id IN (${join(errors.updatedCartProducts.map((cp: z.output<typeof cartProductSerializer>) => cp.id))})
        `;
        const latestCartProducts = await mysqlGetQuery<DatabaseCartProduct>(pool.execute(query.sql, query.values));
        assert.deepStrictEqual(
            errors.updatedCartProducts,
            await z.array(cartProductSerializer).parseAsync(latestCartProducts),
        );
    }, "Fail To Checkout Cart Products With Outdated Data");

    await test(async () => {
        const { cartProducts } = await ADMIN_1_CART_MIXN();
        const cartProduct = cartProducts[0];
        const insertId = await Order.create({
            user_id: users.ADMIN_1.id,
            product_id: cartProduct.product_id,
            amount: cartProduct.amount,
            status: "pending",
            ...DUMMY_SHIPPING_DATA,
        });

        const response = await fetch(`http://localhost:3001/api/orders/${insertId}/confirm_shipping`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: objectToFormData({
                tracking_number: "123",
                courier_name: "courier",
                additional_information: "extra info",
            }),
        });

        //
        assert.strictEqual(response.status, 200);

        //
        const data: {
            order: z.output<typeof orderSerializer>;
            orderShipping: z.output<typeof orderShippingSerializer>;
        } = await response.json();

        const dbOrder = await mysqlGetOrThrow<DatabaseOrder>(
            pool.execute(`SELECT * FROM _order WHERE id = ?`, [insertId]),
        );
        const dbOrderShipping = await mysqlGetOrThrow<DatabaseOrderShipping>(
            pool.execute(`SELECT * FROM order_shipping WHERE order_id = ?`, [insertId]),
        );

        assert.deepStrictEqual(
            {
                ...data.order,
                date_created: new Date(data.order.date_created),
            },
            orderSerializer.parse(dbOrder),
        );
        assert.deepStrictEqual(
            {
                ...data.orderShipping,
                date_created: new Date(data.orderShipping.date_created),
            },
            orderShippingSerializer.parse(dbOrderShipping),
        );

        //
        assert.strictEqual(data.order.status, "shipping");
    }, "Confirm Order Shipping As Admin");

    await test(async () => {
        const { cartProducts } = await ADMIN_1_CART_MIXN();
        const cartProduct = cartProducts[0];
        const insertId = await Order.create({
            user_id: users.ADMIN_1.id,
            product_id: cartProduct.product_id,
            amount: cartProduct.amount,
            status: "pending",
            ...DUMMY_SHIPPING_DATA,
        });

        const response = await fetch(`http://localhost:3001/api/orders/${insertId}/confirm_shipping`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: objectToFormData({
                tracking_number: "",
                courier_name: "",
                additional_information: "*".repeat(1029),
            }),
        });

        //
        assert.strictEqual(response.status, 400);

        //
        const errors = await response.json();
        assert.ok(Object.entries(errors).length);
    }, "Fail To Confirm Order Shipping As Admin With Invalid Data");

    await test(async () => {
        const { cartProducts } = await ADMIN_1_CART_MIXN();
        const cartProduct = cartProducts[0];
        const insertId = await Order.create({
            user_id: users.ADMIN_1.id,
            product_id: cartProduct.product_id,
            amount: cartProduct.amount,
            status: "pending",
            ...DUMMY_SHIPPING_DATA,
        });

        const response = await fetch(`http://localhost:3001/api/orders/${insertId}/confirm_shipping`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: CUSTOMER_1_COOKIE,
            },
            body: objectToFormData({
                tracking_number: "123",
                courier_name: "courier",
                additional_information: "extra info",
            }),
        });

        //
        assert.strictEqual(response.status, 403);
    }, "Fail To Confirm Order Shipping As Client");

    await test(async () => {
        const cartProduct = await createCartProduct({
            user_id: users.CUSTOMER_1.id,
            amount: 1,
            product_id: products.ADMIN_1__PRODUCT_1.id,
        });

        const insertId = await Order.create({
            user_id: users.CUSTOMER_1.id,
            product_id: cartProduct.product_id,
            amount: cartProduct.amount,
            status: "pending",
            ...DUMMY_SHIPPING_DATA,
        });

        const response = await fetch(`http://localhost:3001/api/orders/${insertId}/confirm_completed`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: CUSTOMER_1_COOKIE,
                "Content-Type": "application/json",
            },
        });

        assert.strictEqual(response.status, 200);

        const data = await response.json();
        const order = await mysqlGetOrThrow<DatabaseOrder>(
            pool.execute(`SELECT * FROM _order WHERE id = ?`, [insertId]),
        );

        assert.deepStrictEqual(
            {
                ...data,
                date_created: new Date(data.date_created),
            },
            orderSerializer.parse(order),
        );
        assert.strictEqual(order.status, "completed");
    }, "Confirm Order Complete As Client");

    await test(async () => {
        const { cartProducts } = await ADMIN_1_CART_MIXN();
        const cartProduct = cartProducts[0];
        const insertId = await Order.create({
            user_id: users.ADMIN_1.id,
            product_id: cartProduct.product_id,
            amount: cartProduct.amount,
            status: "pending",
            ...DUMMY_SHIPPING_DATA,
        });

        const response = await fetch(`http://localhost:3001/api/orders/${insertId}/confirm_completed`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
                "Content-Type": "application/json",
            },
        });

        assert.strictEqual(response.status, 200);
        // ...
        const order = await mysqlGetOrThrow<DatabaseOrder>(
            pool.execute(`SELECT * FROM _order WHERE id = ?`, [insertId]),
        );
        // ...
        assert.strictEqual(order.status, "presumed_completed");
    }, "Confirm Order Presumed Complete As Admin");

    await test(async () => {
        // ...
        const cart = await dbOperation(
            async (connection) =>
                await mysqlGetOrThrow<DatabaseCart>(
                    connection.execute(`SELECT * FROM cart WHERE user_id = ?`, [users.CUSTOMER_1.id]),
                ),
        );
        const product = products.ADMIN_1__PRODUCT_1;
        await CartProduct.create({
            product_id: product.id,
            amount: 1,
            cart_id: cart.id,
        });
        const insertId = await Order.create({
            user_id: users.CUSTOMER_1.id,
            product_id: product.id,
            amount: 1,
            status: "pending",
            ...DUMMY_SHIPPING_DATA,
        });

        // ... confirm order / create order shipping
        await fetch(`http://localhost:3001/api/orders/${insertId}/confirm_shipping`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: objectToFormData({
                tracking_number: "123",
                courier_name: "courier",
                additional_information: "extra info",
            }),
        });

        // ... retrieve order shipping (as customer)
        let response = await fetch(`http://localhost:3001/api/orders/${insertId}/shipping`, {
            method: "GET",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: CUSTOMER_1_COOKIE,
            },
        });

        // ...
        assert.strictEqual(response.status, 200);

        // ...
        const data: z.output<typeof orderShippingSerializer> = await response.json();
        const ordershipping = await mysqlGetOrThrow<DatabaseOrderShipping>(
            pool.execute(`SELECT * FROM order_shipping WHERE order_id = ?`, [insertId]),
        );
        assert.deepStrictEqual(orderShippingSerializer.parse(ordershipping), {
            ...data,
            date_created: new Date(data.date_created),
        });

        // ... retrieve order shipping (as admin)
        response = await fetch(`http://localhost:3001/api/orders/${insertId}/shipping`, {
            method: "GET",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
        });

        // ...
        assert.strictEqual(response.status, 200);
    }, "Successfully fetch order shipping data as client or admin");
});
