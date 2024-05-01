import mysql, { FieldPacket, RowDataPacket } from "mysql2/promise";
import { getFromContext } from "./context.js";
import { NextFunction, Request, Response } from "express";
import fsp from "fs/promises";
import multer from "multer";

export async function dbOperation<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    let connection: mysql.PoolConnection | null = null;

    try {
        const pool = getFromContext("pool");
        connection = await pool.getConnection();
        if (connection != null) {
            return await callback(connection);
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
