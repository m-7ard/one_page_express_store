import { env } from "process";
import context, { getFromContext } from "../backend/context.js";
import { DatabaseCart, DatabaseCartProduct, DatabaseUser } from "../backend/database_types.js";
import { CartProduct, User } from "../backend/managers.js";
import { mysqlGetOrNull, mysqlGetOrThrow, mysqlGetQuery, mysqlQueryTableByID } from "../backend/utils.js";
import { createCartProduct, createSessionCookie, objectToFormData, test, testCase } from "./_utils.js";
import { cartProductMixin, productsMixin, usersMixin } from "./mixins.js";
import assert from "assert";
import { cartProductSerializer, cartSerializer } from "../backend/serializers.js";
import { object, z } from "zod";
import { cartProductSchema } from "../backend/schemas.js";

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
});
