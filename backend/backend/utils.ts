import mysql, { FieldPacket, RowDataPacket } from "mysql2/promise";
import { env } from "process";
import { exec } from "child_process";
import { getFromContext } from "./context.js";

export async function dbOperation<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    let connection: mysql.PoolConnection | null = null;

    try {
        const pool = getFromContext('pool');
        connection = await pool.getConnection();
        if (connection != null) {
            return await callback(connection);
        }

        throw new Error("Failed to establish connection");
    } finally {
        connection?.release();
    }
}

export function dbData(): Promise<string> {
    /* 
        Requires mariaDB to be added as a PATH variable. 
        In case you want to use mysql, you need to add mysql as a PATH variable and use mysqldump.
    */
    const command = `mariadb-dump -u ${env.USER} -p${env.PASSWORD} -h ${env.HOST} ${env.DATABASE} --no-data`;

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

export async function mysqlGetOrThrow<T extends RowDataPacket>(
    queryPromise: Promise<[T[], FieldPacket[]]>,
): Promise<T> {
    const [query] = await queryPromise;
    if (query.length === 0) {
        throw Error("Query returned no result.");
    } else if (query.length > 1) {
        throw Error("Query returned more than one result.");
    }
    const [result] = query;
    return result;
}

export async function mysqlGetOrNull<T extends RowDataPacket>(queryPromise: Promise<[T[], FieldPacket[]]>): Promise<T | null> {
    const [query] = await queryPromise;
    if (query.length === 0) {
        return null;
    } else if (query.length > 1) {
        throw Error("Query returned more than one result.");
    }
    const [result] = query;
    return result;
}

export async function mysqlGetQuery<T extends RowDataPacket>(queryPromise: Promise<[T[], FieldPacket[]]>): Promise<T[]> {
    const [query] = await queryPromise;
    return query;
}
