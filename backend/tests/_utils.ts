import { dbData, mysqlGetOrThrow } from "../backend/utils.js";
import mysql, { ResultSetHeader } from "mysql2/promise";
import { env } from "process";
import context, { getFromContext } from "../backend/context.js";
import { generateId } from "lucia";
import { Argon2id } from "oslo/password";
import { DatabaseUser } from "../backend/database_types.js";

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
            await connection.query(`CREATE DATABASE one_page_store_TESTING`);

            try {
                const pool = mysql.createPool({
                    host: env.HOST,
                    user: env.USER,
                    password: env.PASSWORD,
                    database: "one_page_store_TESTING",
                    multipleStatements: true,
                });
                context.pool = pool;
                await pool.query(dbCreationString);

                const { setUpApp } = await import("../backend/app.js");
                const app = await setUpApp();

                const server = app.listen(3001, () => {
                    console.log("Test server listening.");
                });

                return await callback();
            } finally {
                await connection.query(`DROP DATABASE one_page_store_TESTING`);
            }
        }

        throw new Error("Failed to establish connection");
    } finally {
        connection?.end();
    }
}

export async function createUser({ username, isAdmin }: { username: string; isAdmin: boolean }) {
    const pool = getFromContext("pool");
    const userData = {
        id: generateId(15),
        username: username,
        hashed_password: await new Argon2id().hash("userword"),
        is_admin: isAdmin ? 1 : 0,
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
    userId,
    specification,
    images,
    kind,
    description = "lorem ipsum",
}: {
    name: string;
    price: number;
    userId: string;
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
        user_id: userId,
    };

    const result = await pool.execute<ResultSetHeader>({
        sql: `INSERT INTO PRODUCT (name, description, price, kind, specification, images, user_id) 
            VALUES (:name, :description, :price, :kind, :specification, :images, :user_id)`,
        values: productData,
        namedPlaceholders: true,
    });

    const productId = result[0].insertId;

    const product = await mysqlGetOrThrow<DatabaseUser>(
        pool.execute(`SELECT * FROM product WHERE id = ?`, [productId]),
    );

    return product;
}
