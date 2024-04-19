import mysql from "mysql2/promise";
import { pool } from "../lib/db.js";

export async function dbOperation<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    let connection: mysql.PoolConnection | null = null;

    try {
        connection = await pool.getConnection();
        if (connection != null) {
            return await callback(connection);
        }

        throw new Error("Failed to establish connection");
    } finally {
        connection?.release();
    }
}
