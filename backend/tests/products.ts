import { createSessionCookie, objectToFormData, test, testCase } from "./_utils.js";
import { productSerializer } from "../backend/serializers.js";
import assert from "assert";
import { z } from "zod";
import { productsMixin, usersMixin } from "./mixins.js";
import { fileExists, mysqlGetOrNull, mysqlGetOrThrow, mysqlGetQuery } from "../backend/utils.js";
import { DatabaseProduct } from "../backend/database_types.js";
import context, { getFromContext } from "../backend/context.js";
import { env } from "process";
import { rm } from "fs/promises";
import { BASE_DIR, MEDIA_DIR } from "../backend/settings.js";
import path from "path";
import { readFileSync } from "fs";
import mime from "mime-types";
import { PRODUCT } from "../backend/constants.js";

const EXPECTED_TOTAL_PRODUCT_COUNT = 3;
const EXPECTED_PRICE_OVER_500_PRODUCT_COUNT = 2;
const EXPECTED_PRICE_UNDER_500_PRODUCT_COUNT = 1;
const EXPECTED_SPEC_BUILDING_IS_TALL = 2;
const DEFAULT_ORDER_BY = "id DESC";
const REQUIRED_PRODUCT_FIELDS = ["name", "price", "kind", "specification"];

context.testsToRun = '__all__';

testCase(async () => {
    const pool = getFromContext("pool");
    const users = await usersMixin();
    const products = await productsMixin({ users });

    const CUSTOMER_1_COOKIE = await createSessionCookie(users.CUSTOMER_1.id);
    const ADMIN_1_COOKIE = await createSessionCookie(users.ADMIN_1.id);

    //////////////
    /// LIST
    ///

    await test(async () => {
        const response = await fetch("http://localhost:3001/api/products/list");
        const data = await response.json();
        const expectedData = await mysqlGetQuery<DatabaseProduct>(
            pool.query(`SELECT * FROM product ORDER BY ${DEFAULT_ORDER_BY}`),
        );
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.results.length, EXPECTED_TOTAL_PRODUCT_COUNT);
        assert.strictEqual(data.count, EXPECTED_TOTAL_PRODUCT_COUNT);
        assert.deepStrictEqual(
            data.results,
            z.array(productSerializer).parse(expectedData),
            "Retrieved products returned wrong data or in wrong order.",
        );
    }, "List Products Without Query");

    await test(async () => {
        const response = await fetch("http://localhost:3001/api/products/list?min_price=500");
        const data = await response.json();
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.results.length, EXPECTED_PRICE_OVER_500_PRODUCT_COUNT);
        assert.strictEqual(data.count, EXPECTED_PRICE_OVER_500_PRODUCT_COUNT);
        const expectedData = await mysqlGetQuery<DatabaseProduct>(
            pool.query(`SELECT * FROM product WHERE price > 500 ORDER BY ${DEFAULT_ORDER_BY}`),
        );
        assert.deepStrictEqual(data.results, z.array(productSerializer).parse(expectedData));
    }, "List Products With Min Price Query");

    await test(async () => {
        let response = await fetch("http://localhost:3001/api/products/list?max_price=500");
        let data = await response.json();
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.results.length, EXPECTED_PRICE_UNDER_500_PRODUCT_COUNT);
        assert.strictEqual(data.count, EXPECTED_PRICE_UNDER_500_PRODUCT_COUNT);
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
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.results.length, EXPECTED_SPEC_BUILDING_IS_TALL);
        assert.strictEqual(data.count, EXPECTED_SPEC_BUILDING_IS_TALL);
        assert.deepStrictEqual(data.results, z.array(productSerializer).parse(expectedData));
    }, "List Products With Specification Query");



    //////////////
    /// CREATE
    ///



    const VALID_CREATE_PRODUCT_DATA = {
        name: "New Ad",
        description: "desc",
        price: "100",
        kind: "Tea",
        specification: JSON.stringify([
            ["building", "tall"],
            ["chicken", "coop"],
        ]),
    }

    await test(async () => {
        const response = await fetch("http://localhost:3001/api/products/create/", {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: objectToFormData(VALID_CREATE_PRODUCT_DATA),
        });

        const data: DatabaseProduct = await response.json();

        assert.strictEqual(response.status, 201);
        const product = await mysqlGetOrThrow<DatabaseProduct>(
            pool.execute(`SELECT * FROM product WHERE id = ?`, [data.id]),
        );
        assert.deepStrictEqual(data, productSerializer.parse(product));
        assert.strictEqual(data.user_id, product.user_id);
        await pool.execute(`DELETE FROM product where id = ?`, [data.id]);
    }, "Create Product As Admin");

    await test(async () => {
        const response = await fetch("http://localhost:3001/api/products/create/", {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: CUSTOMER_1_COOKIE,
            },
            body: objectToFormData(VALID_CREATE_PRODUCT_DATA),
        });

        const productsQuery = await mysqlGetQuery<DatabaseProduct>(pool.execute(`SELECT * FROM product`));

        assert.strictEqual(response.status, 403);
        assert.strictEqual(productsQuery.length, EXPECTED_TOTAL_PRODUCT_COUNT);
    }, "Fail To Create Product As Client");

    await test(async () => {
        const response = await fetch("http://localhost:3001/api/products/create/", {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
            },
            body: objectToFormData(VALID_CREATE_PRODUCT_DATA),
        });

        const productsQuery = await mysqlGetQuery<DatabaseProduct>(pool.execute(`SELECT * FROM product`));

        assert.strictEqual(response.status, 403);
        assert.strictEqual(productsQuery.length, EXPECTED_TOTAL_PRODUCT_COUNT);
    }, "Fail To Create Product As Unlogged User");

    await test(async () => {
        const response = await fetch("http://localhost:3001/api/products/create/", {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: objectToFormData({}),
        });

        const productsQuery = await mysqlGetQuery<DatabaseProduct>(pool.execute(`SELECT * FROM product`));

        assert.strictEqual(response.status, 400);
        const errors = await response.json();
        assert.strictEqual(productsQuery.length, EXPECTED_TOTAL_PRODUCT_COUNT);
        REQUIRED_PRODUCT_FIELDS.forEach((fieldName) => {
            assert.ok(errors.fieldErrors.hasOwnProperty(fieldName), `${fieldName} is missing from errors.`);
        });
    }, "Fail To Create Product With Missing Data");


    await test(async () => {
        const largeSizeFilePath = path.join(BASE_DIR, "backend", "static", "images", "tests", "bigimage.png");
        const largeSizeFile = readFileSync(largeSizeFilePath);
        const sendData = objectToFormData(VALID_CREATE_PRODUCT_DATA);
        sendData.append(
            "image-1",
            new Blob([largeSizeFile], { type: mime.lookup(largeSizeFilePath) || undefined }),
            "big-image.png",
        );
        const response = await fetch(`http://localhost:3001/api/products/create/`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: sendData,
        });

        const product = await mysqlGetOrThrow<DatabaseProduct>(
            pool.execute(`SELECT * FROM product WHERE id = ?`, [products.ADMIN_1__PRODUCT_1.id]),
        );

        assert.strictEqual(response.status, 400);
        assert.deepStrictEqual(
            productSerializer.parse(products.ADMIN_1__PRODUCT_1),
            productSerializer.parse(product),
        );
    }, "Fail To Create Product With Image Over Size Limit");

    await test(async () => {
        const invalidFormatFilePath = path.join(BASE_DIR, "backend", "static", "images", "tests", "text_file.txt");
        const invalidFormatFile = readFileSync(invalidFormatFilePath);
        const sendData = objectToFormData(VALID_CREATE_PRODUCT_DATA);
        sendData.append(
            "image-1",
            new Blob([invalidFormatFile], { type: mime.lookup(invalidFormatFilePath) || undefined }),
            "text_file.txt",
        );
        const response = await fetch(`http://localhost:3001/api/products/create/`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: sendData,
        });

        const product = await mysqlGetOrThrow<DatabaseProduct>(
            pool.execute(`SELECT * FROM product WHERE id = ?`, [products.ADMIN_1__PRODUCT_1.id]),
        );

        assert.strictEqual(response.status, 400);
        assert.deepStrictEqual(
            productSerializer.parse(products.ADMIN_1__PRODUCT_1),
            productSerializer.parse(product),
        );
    }, "Fail To Create Product With Invalid Image File Format");

    await test(async () => {
        const validImagePath = path.join(BASE_DIR, "backend", "static", "images", "tests", "valid_image.jpg");
        const validFile = readFileSync(validImagePath);
        const sendData = objectToFormData(VALID_CREATE_PRODUCT_DATA);
        for (let i = 0; i < PRODUCT.MAX_IMAGES_LENGTH; i++) {
            sendData.append(
                `image-${i}`,
                new Blob([validFile], { type: mime.lookup(validImagePath) || undefined }),
                "test.jpg",
            );
        }

        const response = await fetch(`http://localhost:3001/api/products/create/`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: sendData,
        });

        const product = await mysqlGetOrThrow<DatabaseProduct>(
            pool.execute(`SELECT * FROM product WHERE id = ?`, [products.ADMIN_1__PRODUCT_1.id]),
        );

        assert.strictEqual(response.status, 400);
        assert.deepStrictEqual(
            productSerializer.parse(products.ADMIN_1__PRODUCT_1),
            productSerializer.parse(product),
        );
    }, "Fail To Create Product With Too Many Images");



    //////////////
    /// EDIT
    ///


    
    const VALID_NEW_PRODUCT_DATA = {
        name: "Admin One Ad #2 EDITED",
        description: "desc",
        price: "100",
        kind: "Tea",
        specification: JSON.stringify([
            ["building", "tall"],
            ["chicken", "coop"],
        ]),
    };

    await test(async () => {
        const response = await fetch(`http://localhost:3001/api/products/edit/${products.ADMIN_1__PRODUCT_1.id}`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: objectToFormData(VALID_NEW_PRODUCT_DATA),
        });

        const data: DatabaseProduct = await response.json();
        const product = await mysqlGetOrThrow<DatabaseProduct>(
            pool.execute(`SELECT * FROM product WHERE id = ?`, [products.ADMIN_1__PRODUCT_1.id]),
        );

        assert.strictEqual(response.status, 200);
        assert.deepStrictEqual(data, productSerializer.parse(product));
    }, "Edit Product As Admin (Without Images)");

    await test(async () => {
        const response = await fetch(`http://localhost:3001/api/products/edit/${products.ADMIN_1__PRODUCT_1.id}`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: CUSTOMER_1_COOKIE,
            },
            body: objectToFormData(VALID_NEW_PRODUCT_DATA),
        });

        const product = await mysqlGetOrThrow<DatabaseProduct>(
            pool.execute(`SELECT * FROM product WHERE id = ?`, [products.ADMIN_1__PRODUCT_1.id]),
        );

        assert.strictEqual(response.status, 403);
        assert.deepStrictEqual(
            productSerializer.parse(products.ADMIN_1__PRODUCT_1),
            productSerializer.parse(product),
        );
    }, "Fail To Edit Product As Customer");

    await test(async () => {
        const response = await fetch(`http://localhost:3001/api/products/edit/${products.ADMIN_1__PRODUCT_1.id}`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
            },
            body: objectToFormData(VALID_NEW_PRODUCT_DATA),
        });

        const product = await mysqlGetOrThrow<DatabaseProduct>(
            pool.execute(`SELECT * FROM product WHERE id = ?`, [products.ADMIN_1__PRODUCT_1.id]),
        );

        assert.strictEqual(response.status, 403);
        assert.deepStrictEqual(
            productSerializer.parse(products.ADMIN_1__PRODUCT_1),
            productSerializer.parse(product),
        );
    }, "Fail To Edit Product As Vistor");

    await test(async () => {
        const largeSizeFilePath = path.join(BASE_DIR, "backend", "static", "images", "tests", "bigimage.png");
        const largeSizeFile = readFileSync(largeSizeFilePath);
        const sendData = objectToFormData(VALID_NEW_PRODUCT_DATA);
        sendData.append(
            "image-1",
            new Blob([largeSizeFile], { type: mime.lookup(largeSizeFilePath) || undefined }),
            "big-image.png",
        );
        const response = await fetch(`http://localhost:3001/api/products/edit/${products.ADMIN_1__PRODUCT_1.id}`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: sendData,
        });

        const product = await mysqlGetOrThrow<DatabaseProduct>(
            pool.execute(`SELECT * FROM product WHERE id = ?`, [products.ADMIN_1__PRODUCT_1.id]),
        );

        assert.strictEqual(response.status, 400);
        assert.deepStrictEqual(
            productSerializer.parse(products.ADMIN_1__PRODUCT_1),
            productSerializer.parse(product),
        );
    }, "Fail To Edit Product With Image Over Size Limit");

    await test(async () => {
        const invalidFormatFilePath = path.join(BASE_DIR, "backend", "static", "images", "tests", "text_file.txt");
        const invalidFormatFile = readFileSync(invalidFormatFilePath);
        const sendData = objectToFormData(VALID_NEW_PRODUCT_DATA);
        sendData.append(
            "image-1",
            new Blob([invalidFormatFile], { type: mime.lookup(invalidFormatFilePath) || undefined }),
            "text_file.txt",
        );
        const response = await fetch(`http://localhost:3001/api/products/edit/${products.ADMIN_1__PRODUCT_1.id}`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: sendData,
        });

        const product = await mysqlGetOrThrow<DatabaseProduct>(
            pool.execute(`SELECT * FROM product WHERE id = ?`, [products.ADMIN_1__PRODUCT_1.id]),
        );

        assert.strictEqual(response.status, 400);
        assert.deepStrictEqual(
            productSerializer.parse(products.ADMIN_1__PRODUCT_1),
            productSerializer.parse(product),
        );
    }, "Fail To Edit Product With Invalid Image File Format");

    await test(async () => {
        const validImagePath = path.join(BASE_DIR, "backend", "static", "images", "tests", "valid_image.jpg");
        const validFile = readFileSync(validImagePath);
        const sendData = objectToFormData(VALID_NEW_PRODUCT_DATA);
        for (let i = 0; i < PRODUCT.MAX_IMAGES_LENGTH; i++) {
            sendData.append(
                `image-${i}`,
                new Blob([validFile], { type: mime.lookup(validImagePath) || undefined }),
                "test.jpg",
            );
        }

        const response = await fetch(`http://localhost:3001/api/products/edit/${products.ADMIN_1__PRODUCT_1.id}`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: sendData,
        });

        const product = await mysqlGetOrThrow<DatabaseProduct>(
            pool.execute(`SELECT * FROM product WHERE id = ?`, [products.ADMIN_1__PRODUCT_1.id]),
        );

        assert.strictEqual(response.status, 400);
        assert.deepStrictEqual(
            productSerializer.parse(products.ADMIN_1__PRODUCT_1),
            productSerializer.parse(product),
        );
    }, "Fail To Edit Product With Too Many Images");

    const createProductWithImage = async () => {
        const validImagePath = path.join(BASE_DIR, "backend", "static", "images", "tests", "valid_image.jpg");
        const validFile = readFileSync(validImagePath);
        const sendData = objectToFormData(VALID_NEW_PRODUCT_DATA);
        sendData.append(
            "image-1",
            new Blob([validFile], { type: mime.lookup(validImagePath) || undefined }),
            "test.jpg",
        );
        const response = await fetch(`http://localhost:3001/api/products/create`, {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: sendData,
        });
        const data: z.infer<typeof productSerializer> = await response.json();
        const savedImageDir = path.join(MEDIA_DIR, data.images[0]);
        return { response, data, savedImageDir };
    };

    await test(async () => {
        const { response, data, savedImageDir } = await createProductWithImage();
        assert.strictEqual(response.status, 201);
        assert.strictEqual(data.images.length, 1);
        assert.ok(await fileExists(savedImageDir));
        await rm(savedImageDir);
    }, "Create Product With Image And Save File");

    await test(async () => {
        const { savedImageDir, data } = await createProductWithImage();
        const sendData = objectToFormData(VALID_NEW_PRODUCT_DATA);
        const response = await fetch(`http://localhost:3001/api/products/edit/${data.id}`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: sendData,
        });
        const newData: z.infer<typeof productSerializer> = await response.json();
        assert.strictEqual(response.status, 200);
        assert.strictEqual(newData.images.length, 0);
        assert.ok((await fileExists(savedImageDir)) === false);
    }, "Edit Product With Image And Delete File");

    await test(async () => {
        const { savedImageDir, data } = await createProductWithImage();
        const sendData = objectToFormData(VALID_NEW_PRODUCT_DATA);
        data.images.forEach((image, i) => sendData.append(`image-${i}`, image));
        const response = await fetch(`http://localhost:3001/api/products/edit/${data.id}`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: sendData,
        });
        const newData: z.infer<typeof productSerializer> = await response.json();
        assert.strictEqual(response.status, 200);
        assert.strictEqual(newData.images.length, 1);
        assert.ok(fileExists(savedImageDir));
        await rm(savedImageDir);
    }, "Edit Product With Image And Keep File");

    await test(async () => {
        const { savedImageDir, data } = await createProductWithImage();
        const sendData = objectToFormData(VALID_NEW_PRODUCT_DATA);
        sendData.append("image-1", data.images[0]);
        sendData.append("image-2", "some_image_that_did_not_exist_on_the_product_beforehand.png");
        const response = await fetch(`http://localhost:3001/api/products/edit/${data.id}`, {
            method: "PUT",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: ADMIN_1_COOKIE,
            },
            body: sendData,
        });

        assert.strictEqual(response.status, 400);
        await rm(savedImageDir);
    }, "Fail To Edit Product With Unknown Image");

    //////////////
    /// DELETE
    ///

    await test(async () => {
        const response = await fetch(
            `http://localhost:3001/api/products/delete/${products.ADMIN_1__PRODUCT_1.id}`,
            {
                method: "POST",
                headers: {
                    Origin: env.ORIGIN as string,
                    Cookie: ADMIN_1_COOKIE,
                },
            },
        );
        const product = await mysqlGetOrNull<DatabaseProduct>(
            pool.execute(`SELECT * FROM product WHERE id = ?`, [products.ADMIN_1__PRODUCT_1.id]),
        );
        const productsQuery = await mysqlGetQuery<DatabaseProduct>(pool.execute(`SELECT * FROM product`));

        assert.strictEqual(response.status, 200);
        assert.strictEqual(product, null);
        assert.strictEqual(productsQuery.length, EXPECTED_TOTAL_PRODUCT_COUNT - 1);
    }, "Delete Product As Admin");

    await test(async () => {
        const response = await fetch(
            `http://localhost:3001/api/products/delete/${products.ADMIN_1__PRODUCT_1.id}`,
            {
                method: "POST",
                headers: {
                    Origin: env.ORIGIN as string,
                    Cookie: CUSTOMER_1_COOKIE,
                },
            },
        );
        const product = await mysqlGetOrNull<DatabaseProduct>(
            pool.execute(`SELECT * FROM product WHERE id = ?`, [products.ADMIN_1__PRODUCT_1.id]),
        );
        const productsQuery = await mysqlGetQuery<DatabaseProduct>(pool.execute(`SELECT * FROM product`));

        assert.strictEqual(response.status, 403);
        assert.deepEqual(productSerializer.parse(product), productSerializer.parse(products.ADMIN_1__PRODUCT_1));
        assert.strictEqual(productsQuery.length, EXPECTED_TOTAL_PRODUCT_COUNT);
    }, "Fail To Delete Product As Customer");

    await test(async () => {
        const response = await fetch(
            `http://localhost:3001/api/products/delete/${products.ADMIN_1__PRODUCT_1.id}`,
            {
                method: "POST",
                headers: {
                    Origin: env.ORIGIN as string,
                },
            },
        );
        const product = await mysqlGetOrNull<DatabaseProduct>(
            pool.execute(`SELECT * FROM product WHERE id = ?`, [products.ADMIN_1__PRODUCT_1.id]),
        );
        const productsQuery = await mysqlGetQuery<DatabaseProduct>(pool.execute(`SELECT * FROM product`));

        assert.strictEqual(response.status, 403);
        assert.deepEqual(productSerializer.parse(product), productSerializer.parse(products.ADMIN_1__PRODUCT_1));
        assert.strictEqual(productsQuery.length, EXPECTED_TOTAL_PRODUCT_COUNT);
    }, "Fail To Delete Product As Visitor");
});
