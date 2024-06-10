import mysql, { FieldPacket, RowDataPacket } from "mysql2/promise";
import { asyncLocalStorage, getFromContext } from "./context.js";
import { NextFunction, Request, Response } from "express";
import fsp from "fs/promises";
import multer from "multer";
import { z } from "zod";
import sql, { Sql, join, raw } from "sql-template-tag";

export async function connectionProvider<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    let connection: mysql.PoolConnection | undefined;

    try {
        const pool = getFromContext("pool");
        connection = await pool.getConnection();

        if (connection == null) {
            throw new Error("Failed to establish connection");
        }

        return await asyncLocalStorage.run(connection, callback, connection);
    } finally {
        connection?.release();
    }
}

export function dbOperation<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    let connection = asyncLocalStorage.getStore();

    if (connection == null) {
        throw new Error("dbOperation must be used within connectionProvider");
    } else {
        return callback(connection);
    }
}

export async function dbOperationWithRollback<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
    /*
        NOTE: If you try to query data within callback with
        this function, you will receive old data, unless you
        call connection.rollback first within the callback
        manually
    */
    let connection = asyncLocalStorage.getStore();

    if (connection == null) {
        throw new Error("dbOperation must be used within connectionProvider");
    } else {
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
            return await connectionProvider(async () => {
                await callback(request, response, next);
            });
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

export async function mysqlQueryTableByID<T extends RowDataPacket>({
    table,
    id,
    fields = "*",
}: {
    table: string;
    id: string | number;
    fields?: string | number;
}): Promise<T[]> {
    return await dbOperation(async (connection) => {
        return await mysqlGetQuery<T>(connection.execute(`SELECT ${fields} FROM ${table} WHERE id = ?`, [id]));
    });
}

export function getFilterStatement({
    filters,
    filterMapping,
}: {
    filters: Record<string, string>;
    filterMapping: Record<string, z.ZodEffects<any, Sql, any>>;
}) {
    const filterStatements = Object.entries(filters).reduce<Sql[]>((acc, [key, value]) => {
        if (filterMapping.hasOwnProperty(key)) {
            try {
                const statement = filterMapping[key].parse(value);
                acc.push(statement);
            } catch {
                return acc;
            }
        }
        return acc;
    }, []);

    return filterStatements.length === 0 ? raw("") : join(filterStatements, " AND ", "WHERE ");
}

export function getSortStatement<T extends Record<string, string>>({
    sort,
    sortMapping,
    defaultSort,
}: {
    sort?: string;
    sortMapping: T;
    defaultSort: keyof T;
}) {
    if (sort == null) {
        return sql`ORDER BY ${defaultSort}`;
    }

    return sql`ORDER BY ${sortMapping[sort] ?? defaultSort}`;
}

export async function getPaginatedQuery<T extends RowDataPacket>({
    prefix,
    queryString,
    queryArgs,
    pageSize,
    pageIndex,
}: {
    prefix: (fields?: string) => string;
    queryString: string;
    queryArgs: unknown[];
    pageSize: number;
    pageIndex: number;
}) {
    return await dbOperation(async (connection) => {
        const resultQuery = await mysqlGetQuery<T>(
            connection.execute(`${prefix()} ${queryString} LIMIT ? OFFSET ?`, [
                ...queryArgs,
                pageSize,
                pageSize * (pageIndex - 1),
            ]),
        );
        const [countQuery] = await mysqlGetQuery<{ total_count: number } & RowDataPacket>(
            connection.execute(`${prefix("COUNT(1) as total_count")} ${queryString}`, [...queryArgs]),
        );
        const { total_count } = countQuery;

        return {
            results: resultQuery,
            count: total_count,
            nextPage: pageSize * pageIndex < total_count ? pageIndex + 1 : null,
            previousPage: pageIndex - 1 > 0 ? pageIndex - 1 : null,
        };
    });
}

export function sqlEqualIfNullShortcut(field: string) {
    return `${field} = IF (:${field} IS NULL, ${field}, :${field})`;
} 
