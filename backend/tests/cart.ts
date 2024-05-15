import { env } from "process";
import context, { getFromContext } from "../backend/context.js";
import { DatabaseCart, DatabaseCartProduct, DatabaseUser } from "../backend/database_types.js";
import { CartProduct, User } from "../backend/managers.js";
import { mysqlGetOrNull, mysqlGetOrThrow, mysqlGetQuery, mysqlQueryTableByID } from "../backend/utils.js";
import { createCartProduct, createSessionCookie, objectToFormData, test, testCase } from "./_utils.js";
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

        const cartProducts = {
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
    };

    await test(async () => {
        const response = await fetch(`http://localhost:3001/api/cart/add_product/${products.ADMIN_2__PRODUCT_1.id}`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: 1,
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
        const response = await fetch(`http://localhost:3001/api/cart/add_product/100000000000`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: 1,
            }),
        });

        assert.strictEqual(response.status, 400);
    }, "Fail To Add Nonexistent Product To Cart");

    await test(async () => {
        const { cart, EXPECTED_CART_PRODUCTS_COUNT } = await ADMIN_1_CART_MIXN();
        const response = await fetch(`http://localhost:3001/api/cart/list_products/`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
        });

        assert.strictEqual(response.status, 201);
        const data: z.output<typeof cartSerializer> = await response.json();
        assert.strictEqual(data.products.length, EXPECTED_CART_PRODUCTS_COUNT);
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
        const { cart, cartProducts, EXPECTED_CART_PRODUCTS_COUNT } = await ADMIN_1_CART_MIXN();
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
        assert.strictEqual(newCartData.products.length, EXPECTED_CART_PRODUCTS_COUNT - 1);
        assert.ok(newCartData.products.find(({ id }) => id === cartProducts.ADMIN_2__PRODUCT_1.id) == null);
    }, "Remove Cart Product");

    await test(async () => {
        const { cart, cartProducts } = await ADMIN_1_CART_MIXN();
        const EXPECTED_NEW_AMOUNT_ADMIN_2__PRODUCT_1 = cartProducts.ADMIN_2__PRODUCT_1.amount + 10;
        const EXPECTED_NEW_AMOUNT_ADMIN_2__PRODUCT_2 = cartProducts.ADMIN_2__PRODUCT_2.amount + 1;

        const response = await fetch(`http://localhost:3001/api/cart/update_products/`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
                "Content-Type": "application/json",
            },
            body: JSON.stringify([
                {
                    id: cartProducts.ADMIN_2__PRODUCT_1.id,
                    amount: EXPECTED_NEW_AMOUNT_ADMIN_2__PRODUCT_1,
                },
                {
                    id: cartProducts.ADMIN_2__PRODUCT_2.id,
                    amount: EXPECTED_NEW_AMOUNT_ADMIN_2__PRODUCT_2,
                },
            ]),
        });

        assert.strictEqual(response.status, 200);
        const newCartData = await cartSerializer.parseAsync(cart);
        assert.strictEqual(
            newCartData.products.find(({ id }) => id === cartProducts.ADMIN_2__PRODUCT_1.id)?.amount,
            EXPECTED_NEW_AMOUNT_ADMIN_2__PRODUCT_1,
        );
        assert.strictEqual(
            newCartData.products.find(({ id }) => id === cartProducts.ADMIN_2__PRODUCT_2.id)?.amount,
            EXPECTED_NEW_AMOUNT_ADMIN_2__PRODUCT_2,
        );
    }, "Update Cart Products");

    await test(async () => {
        const { cart, cartProducts } = await ADMIN_1_CART_MIXN();

        const response = await fetch(`http://localhost:3001/api/cart/update_products/`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: CUSTOMER_1_COOKIE, // we use a different user
                "Content-Type": "application/json",
            },
            body: JSON.stringify([
                {
                    id: cartProducts.ADMIN_2__PRODUCT_1.id,
                    amount: 1,
                },
            ]),
        });

        assert.strictEqual(response.status, 400);
        const newCartData = await cartSerializer.parseAsync(cart);
        assert.strictEqual(
            newCartData.products.find(({ id }) => id === cartProducts.ADMIN_2__PRODUCT_1.id)?.amount,
            cartProducts.ADMIN_2__PRODUCT_1.amount,
        );
    }, "Fail Update Cart Products That Are Not In The Request User Cart");

    await test(async () => {
        const listProductsResponse = await fetch(`http://localhost:3001/api/cart/list_products/`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
            },
        });
        assert.strictEqual(listProductsResponse.status, 403, "/api/cart/list_products/");

        const addProductResponse = await fetch(
            `http://localhost:3001/api/cart/add_product/${products.ADMIN_1__PRODUCT_1.id}`,
            {
                method: "POST",
                headers: {
                    Origin: env.ORIGIN as string,
                    "Content-Type": "application/json",
                },
            },
        );
        assert.strictEqual(addProductResponse.status, 403, "/api/cart/add_product/");

        const removeProductResponse = await fetch(
            `http://localhost:3001/api/cart/remove_product/${products.ADMIN_1__PRODUCT_1.id}`,
            {
                method: "POST",
                headers: {
                    Origin: env.ORIGIN as string,
                },
            },
        );
        assert.strictEqual(removeProductResponse.status, 403, "/api/cart/remove_product/");

        const updateProductsResponse = await fetch(`http://localhost:3001/api/cart/update_products/`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
            },
        });
        assert.strictEqual(updateProductsResponse.status, 403, "/api/cart/update_products/");
    }, "Test Login Required Routes");
});
