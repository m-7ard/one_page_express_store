import { env } from "process";
import context, { getFromContext } from "../backend/context.js";
import { DatabaseCart, DatabaseCartProduct, DatabaseOrder, DatabaseUser } from "../backend/database_types.js";
import { CartProduct, Order, User } from "../backend/managers.js";
import { mysqlGetOrNull, mysqlGetOrThrow, mysqlGetQuery, mysqlQueryTableByID } from "../backend/utils.js";
import { createCartProduct, createProduct, createSessionCookie, objectToFormData, test, testCase } from "./_utils.js";
import { cartProductMixin, productsMixin, usersMixin } from "./mixins.js";
import assert from "assert";
import { cartProductSerializer, cartSerializer, orderSerializer } from "../backend/serializers.js";
import { object, z } from "zod";
import { cartProductSchema } from "../backend/schemas.js";

context.testsToRun = "__all__";

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

    const ADMIN_1_ORDERS_MIXN = async (cartProducts: Awaited<ReturnType<typeof ADMIN_1_CART_MIXN>>["cartProducts"]) => {
        const orders = await Promise.all(cartProducts.map((cp) => Order.create({
            user_id: users.ADMIN_1.id,
            product_id: cp.product_id,
            amount: cp.amount,
            status: "pending",
            ...DUMMY_SHIPPING_DATA
        })));

        return { orders };
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
                cartProducts: cartProducts,
                formData: DUMMY_SHIPPING_DATA,
            }),
        });

        assert.strictEqual(response.status, 201);
        const data = await response.json();
        assert.strictEqual(data.length, EXPECTED_CART_PRODUCTS_COUNT);
        const dbCart = await mysqlGetOrThrow<DatabaseCart>(
            pool.execute("SELECT * FROM cart WHERE user_id = ?", [users.ADMIN_1.id]),
        );
        const cart = await cartSerializer.parseAsync(dbCart);
        assert.strictEqual(cart.products.length, 0);
    }, "Checkout Cart Products");

    await test(async () => {
        const { cartProducts, EXPECTED_CART_PRODUCTS_COUNT, ADMIN_2__PRODUCT_1 } = await ADMIN_1_CART_MIXN();
        ADMIN_2__PRODUCT_1.amount = 1000000;
        const response = await fetch(`http://localhost:3001/api/orders/checkout`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cartProducts: cartProducts,
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
        const { cartProducts, EXPECTED_CART_PRODUCTS_COUNT } = await ADMIN_1_CART_MIXN();
        const orders = await ADMIN_1_ORDERS_MIXN(cartProducts);
        const response = await fetch(`http://localhost:3001/api/orders/list?status=pending`, {
            method: "GET",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
                "Content-Type": "application/json",
            }
        });

        assert.strictEqual(response.status, 200)

        const data = await response.json();
        assert.strictEqual(data.results.length, 24);
        assert.strictEqual(data.count, EXPECTED_CART_PRODUCTS_COUNT);
    }, "Fail To Checkout Cart Products With Invalid Amount");

    await test(async () => {
        const { cartProducts } = await ADMIN_1_CART_MIXN();
        const cartProduct = cartProducts[0];
        const insertId = await Order.create({
            user_id: users.ADMIN_1.id,
            product_id: cartProduct.product_id,
            amount: cartProduct.amount,
            status: "pending",
            ...DUMMY_SHIPPING_DATA
        })

        const response = await fetch(`http://localhost:3001/api/orders/${insertId}/confirm_shipping`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
                "Content-Type": "application/json",
            }
        });

        assert.strictEqual(response.status, 200)

        const data = await response.json();
        const order = await mysqlGetOrThrow<DatabaseOrder>(
            pool.execute(`SELECT * FROM _order WHERE id = ?`, [insertId]),
        );
        
        assert.deepStrictEqual({
            ...data,
            date_created: new Date(data.date_created)
        }, orderSerializer.parse(order));
        assert.strictEqual(order.status, 'shipping');
    }, "Confirm Order Shipping As Admin");

    await test(async () => {
        const { cartProducts } = await ADMIN_1_CART_MIXN();
        const cartProduct = cartProducts[0];
        const insertId = await Order.create({
            user_id: users.ADMIN_1.id,
            product_id: cartProduct.product_id,
            amount: cartProduct.amount,
            status: "pending",
            ...DUMMY_SHIPPING_DATA
        })

        const response = await fetch(`http://localhost:3001/api/orders/${insertId}/confirm_shipping`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: CUSTOMER_1_COOKIE,
                "Content-Type": "application/json",
            }
        });

        assert.strictEqual(response.status, 403)
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
            ...DUMMY_SHIPPING_DATA
        })

        const response = await fetch(`http://localhost:3001/api/orders/${insertId}/confirm_completed`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: CUSTOMER_1_COOKIE,
                "Content-Type": "application/json",
            }
        });

        assert.strictEqual(response.status, 200)

        const data = await response.json();
        const order = await mysqlGetOrThrow<DatabaseOrder>(
            pool.execute(`SELECT * FROM _order WHERE id = ?`, [insertId]),
        );
        
        assert.deepStrictEqual({
            ...data,
            date_created: new Date(data.date_created)
        }, orderSerializer.parse(order));
        assert.strictEqual(order.status, 'completed');
    }, "Confirm Order Complete As Client");

    await test(async () => {
        const { cartProducts } = await ADMIN_1_CART_MIXN();
        const cartProduct = cartProducts[0];
        const insertId = await Order.create({
            user_id: users.ADMIN_1.id,
            product_id: cartProduct.product_id,
            amount: cartProduct.amount,
            status: "pending",
            ...DUMMY_SHIPPING_DATA
        })

        const response = await fetch(`http://localhost:3001/api/orders/${insertId}/confirm_completed`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
                "Content-Type": "application/json",
            }
        });

        assert.strictEqual(response.status, 200)
        // ...
        const order = await mysqlGetOrThrow<DatabaseOrder>(
            pool.execute(`SELECT * FROM _order WHERE id = ?`, [insertId]),
        );
        // ...
        assert.strictEqual(order.status, 'presumed_completed');
    }, "Confirm Order Presumed Complete As Admin");
});
