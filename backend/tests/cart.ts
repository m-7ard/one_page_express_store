import { env } from "process";
import context, { getFromContext } from "../backend/context.js";
import { DatabaseCart, DatabaseCartProduct, DatabaseUser } from "../backend/database_types.js";
import { CartProduct, User } from "../backend/managers.js";
import { mysqlGetOrNull, mysqlGetOrThrow, mysqlGetQuery, mysqlQueryTableByID } from "../backend/utils.js";
import { createSessionCookie, objectToFormData, test, testCase } from "./_utils.js";
import { productsMixin, usersMixin } from "./mixins.js";
import assert from "assert";

context.testsToRun = "__all__";

testCase(async () => {
    const pool = getFromContext("pool");

    const users = await usersMixin();
    const products = await productsMixin({ users });
    const customerOneUserCookie = await createSessionCookie(users.customerOneUser.id);
    const adminOneUserCookie = await createSessionCookie(users.adminOneUser.id);


    await test(async () => {
        const response = await fetch(`http://localhost:3001/api/cart/add_product/${products.adminTwoUserProduct_ONE.id}`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: adminOneUserCookie,
            },
            body: objectToFormData({
                amount: "1"
            }),
        });


        assert.strictEqual(response.status, 201);

        const [cartProduct] = await mysqlQueryTableByID<DatabaseCartProduct>({
            table: "cart_product",
            id: id,
        });
        assert.deepEqual()
        console.log((await response.json()).product.specification)
    }, "Add Product To Cart");
});
