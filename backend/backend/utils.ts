import mysql, { FieldPacket, RowDataPacket } from "mysql2/promise";
import { getFromContext } from "./context.js";
import { NextFunction, Request, Response } from "express";
import fsp from "fs/promises";
import multer from "multer";

export async function dbOperationWithRollback<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    /*
        NOTE: If you try to query data within callback with
        this function, you will receive old data, unless you
        call connection.rollback first within the callback
        manually
    */
    let connection: mysql.PoolConnection | null = null;

    try {
        const pool = getFromContext("pool");
        connection = await pool.getConnection();
        if (connection != null) {
            await connection.beginTransaction();
            try {
                const result = await callback(connection);
                await connection.commit();
                return result;
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        }

        throw new Error("Failed to establish connection");
    } finally {
        connection?.release();
    }
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

export async function mysqlGetOrNull<T extends RowDataPacket>(
    queryPromise: Promise<[T[], FieldPacket[]]>,
): Promise<T | null> {
    const [query] = await queryPromise;
    if (query.length === 0) {
        return null;
    } else if (query.length > 1) {
        throw Error("Query returned more than one result.");
    }
    const [result] = query;
    return result;
}

export async function mysqlGetQuery<T extends RowDataPacket>(
    queryPromise: Promise<[T[], FieldPacket[]]>,
): Promise<T[]> {
    const [query] = await queryPromise;
    return query;
}

export function routeWithErrorHandling(
    callback: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
    return async (request: Request, response: Response, next: NextFunction) => {
        try {
            await callback(request, response, next);
        } catch (error) {
            if (error instanceof multer.MulterError) {
                response.status(500).send(error.message);
            }
            next(error);
        }
    };
}

export async function fileExists(path: string) {
    try {
        return (await fsp.stat(path)).isFile();
    } catch (e) {
        return false;
    }
}

export function blueText(text: string) {
    return `\x1b[34m${text}\x1b[0m`;
}

export function redText(text: string) {
    return `\x1b[31m${text}\x1b[0m`;
}

export function greenText(text: string) {
    return `\x1b[33m${text}\x1b[0m`;
}

export function mysqlPrepareWithPlaceholders({
    connection,
    sql,
    values,
}: {
    connection: mysql.Connection;
    sql: string;
    values: Record<string, string | number | null>;
}) {
    return connection.execute({
        sql,
        values,
        namedPlaceholders: true,
    });
}

export async function mysqlQueryTableByID<T extends RowDataPacket>({ table, id, fields = '*' }: {
    table: string;
    id: string | number;
    fields?: string | number
}): Promise<T[]> {
    return await dbOperationWithRollback(async (connection) => {
        return await mysqlGetQuery<T>(
            connection.execute(`SELECT ${fields} FROM ${table} WHERE id = ?`, [id])
        )
    })
}