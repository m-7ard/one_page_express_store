import { mysqlGetOrThrow } from "../backend/utils.js";
import mysql, { ResultSetHeader } from "mysql2/promise";
import { env } from "process";
import context, { getFromContext } from "../backend/context.js";
import { generateId } from "lucia";
import { Argon2id } from "oslo/password";
import { DatabaseProduct, DatabaseUser } from "../backend/database_types.js";
import { exec } from "child_process";
import { AssertionError } from "assert";

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

                return await callback();
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
    const savedDB = await dbSave();
    const pool = getFromContext("pool");

    try {
        await tester();
        console.log(`[${timestamp}] TEST [${name}] \x1b[33mSUCCESS\x1b[0m\n${divider}`);
    } catch (error) {
        if (error instanceof AssertionError) {
            console.log(`[${timestamp}] TEST [${name}] \x1b[31mFAILED\x1b[31m \x1b[0m\n${error}\n${divider}`);
        } else {
            console.log(`[${timestamp}] TEST [${name}] \x1b[31mERROR\x1b[31m \x1b[0m\n${error}\n${divider}`);
        }
    } finally {
        await pool.query(savedDB);
    }
}

export async function createUser({ username, is_admin }: { username: string; is_admin: boolean }) {
    const pool = getFromContext("pool");
    const userData = {
        id: generateId(15),
        username: username,
        hashed_password: await new Argon2id().hash("userword"),
        is_admin: is_admin ? 1 : 0,
    };

    await pool.execute({
        sql: `INSERT INTO user (id, username, hashed_password, is_admin) VALUES (:id, :username, :hashed_password, :is_admin)`,
        values: userData,
        namedPlaceholders: true,
    });

    const user = await mysqlGetOrThrow<DatabaseUser>(
        pool.execute({
            sql: `SELECT * FROM user WHERE id = :id`,
            values: userData,
            namedPlaceholders: true,
        }),
    );

    return user;
}

export async function createProduct({
    name,
    price,
    user_id,
    specification,
    images,
    kind,
    description = "lorem ipsum",
}: {
    name: string;
    price: number;
    user_id: string;
    specification: Array<[string, string]>;
    images: string[];
    kind: string;
    description?: string;
}) {
    const pool = getFromContext("pool");
    const productData = {
        name: name,
        description: description,
        price: price,
        kind: kind,
        specification: JSON.stringify(specification),
        images: JSON.stringify(images),
        user_id: user_id,
    };

    const result = await pool.execute<ResultSetHeader>({
        sql: `INSERT INTO PRODUCT (name, description, price, kind, specification, images, user_id) 
            VALUES (:name, :description, :price, :kind, :specification, :images, :user_id)`,
        values: productData,
        namedPlaceholders: true,
    });

    const productId = result[0].insertId;

    const product = await mysqlGetOrThrow<DatabaseProduct>(
        pool.execute(`SELECT * FROM product WHERE id = ?`, [productId]),
    );

    return product;
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
