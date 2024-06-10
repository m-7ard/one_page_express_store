import { blueText, connectionProvider, dbOperation, greenText, mysqlGetOrThrow, mysqlQueryTableByID, redText } from "../backend/utils.js";
import mysql, { ResultSetHeader } from "mysql2/promise";
import { env } from "process";
import context, { getFromContext } from "../backend/context.js";
import { generateId } from "lucia";
import { Argon2id } from "oslo/password";
import { DatabaseCart, DatabaseCartProduct, DatabaseProduct, DatabaseUser } from "../backend/database_types.js";
import { exec } from "child_process";
import { AssertionError } from "assert";
import { CartProduct, Product, User } from "../backend/managers.js";
import { productSchema } from "../backend/schemas.js";

function dbData(): Promise<string> {
    /* 
        Requires mariaDB to be added as a PATH variable. 
        In case you want to use mysql, you need to add mysql as a PATH variable and use mysqldump.
    */
    const command = `mysqldump -u ${env.USER} -p${env.PASSWORD} -h ${env.HOST} ${env.DATABASE} --no-data`;

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            if (stderr) {
                reject(stderr);
                return;
            }

            resolve(stdout);
        });
    });
}

export async function testCase<T>(callback: () => Promise<T>): Promise<T> {
    let connection: mysql.Connection | null = null;

    try {
        const dbCreationString = await dbData();
        connection = await mysql.createConnection({
            host: env.HOST,
            user: env.USER,
            password: env.PASSWORD,
            database: "one_page_store",
            multipleStatements: true,
        });
        if (connection != null) {
            await connection.query(`CREATE DATABASE one_page_store_testing`);

            try {
                const pool = mysql.createPool({
                    host: env.HOST,
                    user: env.USER,
                    password: env.PASSWORD,
                    database: "one_page_store_testing",
                    multipleStatements: true,
                });
                context.pool = pool;
                await pool.query(dbCreationString);

                const { setUpApp } = await import("../backend/app.js");
                const app = await setUpApp();

                const server = app.listen(3001, () => {
                    console.log("Test server listening.");
                });

                /*
                    TECHNICAL ISSUE: 
                        In order for error handling to work the next function
                    must be called in the express routes 
                */

                return await connectionProvider(async () => {
                    return await callback();
                })
            } finally {
                await connection.query(`DROP DATABASE one_page_store_testing`);
            }
        }

        throw new Error("Failed to establish connection");
    } catch (error) {
        console.log(error);
    } finally {
        await connection?.end();
        process.exit();
    }
}

export function dbSave(): Promise<string> {
    /* 
        Requires mysql / mariaDB to be added as a PATH variable. 
    */
    const command = `mysqldump -u ${env.USER} -p${env.PASSWORD} -h ${env.HOST} "one_page_store_testing" --opt --replace --add-drop-database	`;

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            if (stderr) {
                reject(stderr);
                return;
            }
            resolve(stdout);
        });
    });
}

export async function test<T>(tester: () => Promise<T>, name: string) {
    const timestamp = `\x1b[33m${new Date().toLocaleTimeString()}\x1b[0m`;
    const divider = "=".repeat(process.stdout.columns);
    const testsToRun = getFromContext("testsToRun");

    if (testsToRun !== "__all__" && !testsToRun.includes(name)) {
        console.log(`[${timestamp}] TEST [${name}] ${blueText("SKIPPED")}\n${divider}`);
        return;
    }

    const savedDB = await dbSave();
    const pool = getFromContext("pool");

    try {
        await tester();
        console.log(`[${timestamp}] TEST [${name}] ${greenText("SUCCESS")}\n${divider}`);
    } catch (error) {
        if (error instanceof AssertionError) {
            console.log(`[${timestamp}] TEST [${name}] ${redText("FAILED")} ${error}\n${divider}`);
        } else {
            console.log(`[${timestamp}] TEST [${name}] ${redText("ERROR")} ${error}\n${divider}`);
        }
    } finally {
        await pool.query(savedDB);
    }
}

export async function createUser({
    username,
    is_admin,
    password,
}: {
    username: string;
    is_admin: boolean;
    password: string;
}) {
    const pool = getFromContext("pool");
    const userData = {
        username: username,
        password: password,
        is_admin: is_admin ? 1 : 0,
    };

    const id = await User.create(userData);
    const user = await mysqlGetOrThrow<DatabaseUser>(pool.execute(`SELECT * FROM user WHERE id = ?`, [id]));
    // We require the non-hashed passowrd to log in through the API.
    return { ...user, password };
}

export async function createProduct({
    name,
    price,
    user_id,
    kind,
    specification = [],
    existingImages = [],
    description = "lorem ipsum",
    available,
}: {
    name: string;
    price: number;
    user_id: string;
    specification: Array<[string, string]>;
    existingImages: string[];
    kind: string;
    description?: string;
    available: number;
}) {
    const id = await Product.create({
        name,
        description,
        price,
        kind,
        newImages: [],
        existingImages: existingImages.map((fileName, index) => ({ index, fileName })),
        specification,
        user_id,
        available,
    });
    const [product] = await mysqlQueryTableByID<DatabaseProduct>({ table: "product", id });
    return product;
}

export async function createCartProduct({
    user_id,
    amount,
    product_id,
}: {
    user_id: string;
    amount: number;
    product_id: number;
}) {
    const cart = await dbOperation(async (connection) => {
        return await mysqlGetOrThrow<DatabaseCart>(
            connection.execute("SELECT * FROM cart WHERE user_id = ?", [user_id]),
        );
    });
    const id = await CartProduct.create({ cart_id: cart.id, amount, product_id });
    const [cartProduct] = await mysqlQueryTableByID<DatabaseCartProduct>({ table: "cart_product", id });
    return cartProduct;
}

export async function createSessionCookie(userId: string) {
    const { lucia } = await import("../lib/auth.js");
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    return sessionCookie.serialize();
}

export function objectToFormData(obj: Record<string, FormDataEntryValue>) {
    const formData = new FormData();

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            formData.append(key, obj[key]);
        }
    }

    return formData;
}
