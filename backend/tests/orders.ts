import { env } from "process";
import context, { getFromContext } from "../backend/context.js";
import { DatabaseCart, DatabaseCartProduct, DatabaseUser } from "../backend/database_types.js";
import { CartProduct, User } from "../backend/managers.js";
import { connectionProvider, mysqlGetOrNull, mysqlGetOrThrow, mysqlGetQuery, mysqlQueryTableByID } from "../backend/utils.js";
import { createCartProduct, createProduct, createSessionCookie, objectToFormData, test, testCase } from "./_utils.js";
import { cartProductMixin, productsMixin, usersMixin } from "./mixins.js";
import assert from "assert";
import { cartProductSerializer, cartSerializer } from "../backend/serializers.js";
import { object, z } from "zod";
import { cartProductSchema } from "../backend/schemas.js";

context.testsToRun = "__all__";

testCase(async () => {
    const pool = getFromContext("pool");

    const { users, products, CUSTOMER_1_COOKIE, ADMIN_1_COOKIE } = await connectionProvider(async () => {
        const users = await usersMixin();
        const products = await productsMixin({ users });
        const CUSTOMER_1_COOKIE = await createSessionCookie(users.CUSTOMER_1.id);
        const ADMIN_1_COOKIE = await createSessionCookie(users.ADMIN_1.id);
        return { users, products, CUSTOMER_1_COOKIE, ADMIN_1_COOKIE };
    });

    const ADMIN_1_CART_MIXN = () => connectionProvider(async () => {
        const cart = await mysqlGetOrThrow<DatabaseCart>(
            pool.execute("SELECT * FROM cart WHERE user_id = ?", [users.ADMIN_1.id]),
        );

        const prods = await Promise.all(Array.from({ length: 100 }).map(async () => {
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
                available: 1
            });
        }))

        const cps = await Promise.all(prods.map(async (prod) => {
            return await createCartProduct({
                user_id: users.ADMIN_1.id,
                amount: 1,
                product_id: prod.id,
            })
        }))
        console.log(123)

        const cartProducts = {
            ...cps.reduce<Record<number | string, any>>((acc, cp) => {
                acc[cp.id] = cp

                return acc
            }, {}),
            ADMIN_2__PRODUCT_1: await createCartProduct({
                user_id: users.ADMIN_1.id,
                amount: 1,
                product_id: products.ADMIN_2__PRODUCT_1.id,
            }),
            ADMIN_2__PRODUCT_2: await createCartProduct({
                user_id: users.ADMIN_1.id,
                amount: 1,
                product_id: products.ADMIN_2__PRODUCT_2.id,
            }),
        };

        const EXPECTED_CART_PRODUCTS_COUNT = Object.keys(cartProducts).length;

        return { cart, cartProducts, EXPECTED_CART_PRODUCTS_COUNT };
    });

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
                cartProducts: Object.values(cartProducts),
                formData: {
                    shipping_name: "true",
                    shipping_address_primary: "true",
                    shipping_address_secondary: "true",
                    shipping_city: "true",
                    shipping_state: "true",
                    shipping_zip: "true",
                    shipping_country: "true",
                },
            }),
        });
        console.log(await response.json())

        assert.strictEqual(response.status, 201);
        const dbCart = await mysqlGetOrThrow<DatabaseCart>(
            pool.execute("SELECT * FROM cart WHERE user_id = ?", [users.ADMIN_1.id]),
        );
        const cart = await cartSerializer.parseAsync(dbCart);
        assert.strictEqual(cart.products.length, EXPECTED_CART_PRODUCTS_COUNT - 2);
    }, "Checkout Cart Products");

    await test(async () => {
        const { cartProducts, EXPECTED_CART_PRODUCTS_COUNT } = await ADMIN_1_CART_MIXN();
        cartProducts.ADMIN_2__PRODUCT_1.amount = 1000000;
        const response = await fetch(`http://localhost:3001/api/orders/checkout`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cartProducts: Object.values(cartProducts),
                formData: {
                    shipping_name: "true",
                    shipping_address_primary: "true",
                    shipping_address_secondary: "true",
                    shipping_city: "true",
                    shipping_state: "true",
                    shipping_zip: "true",
                    shipping_country: "true",
                },
            }),
        });

        assert.strictEqual(response.status, 400);
        const dbCart = await mysqlGetOrThrow<DatabaseCart>(
            pool.execute("SELECT * FROM cart WHERE user_id = ?", [users.ADMIN_1.id]),
        );
        const cart = await cartSerializer.parseAsync(dbCart);
        assert.strictEqual(cart.products.length, EXPECTED_CART_PRODUCTS_COUNT);
    }, "Fail To Checkout Cart Products With Invalid Amount");
});
