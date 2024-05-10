import { env } from "process";
import context, { getFromContext } from "../backend/context.js";
import { DatabaseCart, DatabaseCartProduct, DatabaseUser } from "../backend/database_types.js";
import { CartProduct, User } from "../backend/managers.js";
import { mysqlGetOrNull, mysqlGetOrThrow, mysqlGetQuery, mysqlQueryTableByID } from "../backend/utils.js";
import { createSessionCookie, objectToFormData, test, testCase } from "./_utils.js";
import { cartProductMixin, productsMixin, usersMixin } from "./mixins.js";
import assert from "assert";
import { cartProductSerializer, cartSerializer } from "../backend/serializers.js";
import { z } from "zod";

context.testsToRun = "__all__";

testCase(async () => {
    const pool = getFromContext("pool");

    const users = await usersMixin();
    const products = await productsMixin({ users });
    const CUSTOMER_1_COOKIE = await createSessionCookie(users.CUSTOMER_1.id);
    const ADMIN_1_COOKIE = await createSessionCookie(users.ADMIN_1.id);

    const ADMIN_1_CART_MIXN = async () => {
        const cart = await mysqlGetOrThrow<DatabaseCart>(
            pool.execute("SELECT * FROM cart WHERE user_id = ?", [users.ADMIN_1.id]),
        );

        const insertIDs = [
            CartProduct.create({ cart_id: cart.id, amount: 1, product_id: products.ADMIN_2__PRODUCT_1.id }),
            CartProduct.create({ cart_id: cart.id, amount: 1, product_id: products.ADMIN_2__PRODUCT_2.id }),
        ];

        return { cart, insertIDs }
    }

    await test(async () => {
        const response = await fetch(`http://localhost:3001/api/cart/add_product/${products.ADMIN_2__PRODUCT_1.id}`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: objectToFormData({
                amount: "1",
            }),
        });

        assert.strictEqual(response.status, 201);
        const data: z.output<typeof cartProductSerializer> = await response.json();
        const [cartProduct] = await mysqlQueryTableByID<DatabaseCartProduct>({
            table: "cart_product",
            id: data.id,
        });
        assert.deepEqual(data, await cartProductSerializer.parseAsync(cartProduct));
    }, "Add Product To Cart");

    await test(async () => {
        const { cart, insertIDs } = await ADMIN_1_CART_MIXN();
        const response = await fetch(`http://localhost:3001/api/cart/list_products/`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
        });

        assert.strictEqual(response.status, 201);
        const data: z.output<typeof cartSerializer> = await response.json();
        assert.strictEqual(data.products.length, insertIDs.length);
        assert.deepEqual(data, await cartSerializer.parseAsync(cart));
    }, "List Cart Products");

    await test(async () => {
        const { cart } = await ADMIN_1_CART_MIXN();
        const response = await fetch(
            `http://localhost:3001/api/cart/remove_product/${products.ADMIN_2__PRODUCT_1.id}`,
            {
                method: "POST",
                headers: {
                    Origin: env.ORIGIN as string,
                    Cookie: ADMIN_1_COOKIE,
                },
            },
        );

        assert.strictEqual(response.status, 200);
        const newCartData = await cartSerializer.parseAsync(cart);
        assert.strictEqual(newCartData.products.length, 1);
    }, "Remove Cart Product");

    await test(async () => {
        const { cart } = await ADMIN_1_CART_MIXN();
        const response = await fetch(
            `http://localhost:3001/api/cart/remove_product/${products.ADMIN_2__PRODUCT_1.id}`,
            {
                method: "POST",
                headers: {
                    Origin: env.ORIGIN as string,
                    Cookie: ADMIN_1_COOKIE,
                },
            },
        );

        assert.strictEqual(response.status, 200);
        const newCartData = await cartSerializer.parseAsync(cart);
        assert.strictEqual(newCartData.products.length, 1);
    }, "Remove Cart Product");

    await test(async () => {
        const { cart } = await ADMIN_1_CART_MIXN();
        const response = await fetch(
            `http://localhost:3001/api/cart/remove_product/${products.ADMIN_2__PRODUCT_1.id}`,
            {
                method: "POST",
                headers: {
                    Origin: env.ORIGIN as string,
                    Cookie: ADMIN_1_COOKIE,
                },
            },
        );

        assert.strictEqual(response.status, 200);
        const newCartData = await cartSerializer.parseAsync(cart);
        assert.strictEqual(newCartData.products.length, 1);
    }, "Remove Cart Product");

    await test(async () => {
        const { cart } = await ADMIN_1_CART_MIXN();
        /* TODO: implement route */
        const response = await fetch(
            `http://localhost:3001/api/cart/update_products/`,
            {
                method: "POST",
                headers: {
                    Origin: env.ORIGIN as string,
                    Cookie: ADMIN_1_COOKIE,
                },
            },
        );

        assert.strictEqual(response.status, 200);
        const newCartData = await cartSerializer.parseAsync(cart);
        assert.strictEqual(newCartData.products.length, 1);
    }, "Remove Cart Product");
});
