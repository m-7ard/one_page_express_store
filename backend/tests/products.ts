import { testCase } from "./_utils.js";
import { productSerializer } from "../backend/serializers.js";
import assert from "assert";
import { z } from "zod";
import { productsMixin, usersMixin } from "./mixins.js";
import { mysqlGetQuery } from "../backend/utils.js";
import { DatabaseProduct } from "../backend/database_types.js";
import { getFromContext } from "../backend/context.js";

async function test<T>(tester: () => Promise<T>, name: string, message?: string) {
    const timestamp = `\x1b[33m${new Date().toLocaleTimeString()}\x1b[0m`;
    const divider = "=".repeat(process.stdout.columns);

    try {
        await tester();
        console.log(`[${timestamp}] TEST [${name}] \x1b[33mSuccess\x1b[0m\n${divider}`);

        // console.log(`${divider}\n[${timestamp}] [${name}] TEST \x1b[31mFailed\x1b[31m \x1b[0m\n${divider}`);
    } catch (error) {
        console.log(`[${timestamp}] TEST [${name}] \x1b[31mError\x1b[31m \x1b[0m\n${error}\n${divider}`);
    }
}

const EXPECTED_TOTAL_PRODUCT_COUNT = 3;
const EXPECTED_PRICE_OVER_500_PRODUCT_COUNT = 2;
const EXPECTED_PRICE_UNDER_500_PRODUCT_COUNT = 1;
const EXPECTED_SPEC_BUILDING_IS_TALL = 2;
const DEFAULT_ORDER_BY = "id DESC";

/// ProductTest
testCase(async () => {
    const pool = getFromContext("pool");
    const users = await usersMixin();
    const products = await productsMixin({ users });

    await test(async () => {
        const response = await fetch("http://localhost:3001/api/products/list");
        const data = await response.json();
        const expectedData = await mysqlGetQuery<DatabaseProduct>(
            pool.query(`SELECT * FROM product ORDER BY ${DEFAULT_ORDER_BY}`),
        );
        assert.equal(response.status, 200);
        assert.equal(data.results.length, EXPECTED_TOTAL_PRODUCT_COUNT);
        assert.equal(data.count, EXPECTED_TOTAL_PRODUCT_COUNT);
        assert.deepStrictEqual(
            data.results,
            z.array(productSerializer).parse(expectedData),
            "Retrieved products returned wrong data or in wrong order.",
        );
    }, "List Products Without Query");

    await test(async () => {
        const response = await fetch("http://localhost:3001/api/products/list?min_price=500");
        const data = await response.json();
        assert.equal(response.status, 200);
        assert.equal(data.results.length, EXPECTED_PRICE_OVER_500_PRODUCT_COUNT);
        assert.equal(data.count, EXPECTED_PRICE_OVER_500_PRODUCT_COUNT);
        const expectedData = await mysqlGetQuery<DatabaseProduct>(
            pool.query(`SELECT * FROM product WHERE price > 500 ORDER BY ${DEFAULT_ORDER_BY}`),
        );
        assert.deepStrictEqual(data.results, z.array(productSerializer).parse(expectedData));
    }, "List Products With Min Price Query");

    await test(async () => {
        let response = await fetch("http://localhost:3001/api/products/list?max_price=500");
        let data = await response.json();
        assert.equal(response.status, 200);
        assert.equal(data.results.length, EXPECTED_PRICE_UNDER_500_PRODUCT_COUNT);
        assert.equal(data.count, EXPECTED_PRICE_UNDER_500_PRODUCT_COUNT);
        const expectedData = await mysqlGetQuery<DatabaseProduct>(
            pool.query(`SELECT * FROM product WHERE price < 500 ORDER BY ${DEFAULT_ORDER_BY}`),
        );
        assert.deepStrictEqual(data.results, z.array(productSerializer).parse(expectedData));
    }, "List Products With Max Price Query");

    await test(async () => {
        let response = await fetch("http://localhost:3001/api/products/list?building=tall");
        let data = await response.json();
        const expectedData = await mysqlGetQuery<DatabaseProduct>(
            pool.query(
                `SELECT * FROM product WHERE JSON_CONTAINS(specification, '["building", "tall"]') ORDER BY ${DEFAULT_ORDER_BY}`,
            ),
        );
        assert.equal(response.status, 200);
        assert.equal(data.results.length, EXPECTED_SPEC_BUILDING_IS_TALL);
        assert.equal(data.count, EXPECTED_SPEC_BUILDING_IS_TALL);
        assert.deepStrictEqual(data.results, z.array(productSerializer).parse(expectedData));
    }, "List Products With Specification Query");
});
