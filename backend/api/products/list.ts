import { Request, Response } from "express";
import { dbOperation } from "../../backend/utils.js";
import { DatabaseProduct } from "../../backend/database_types.js";
import { productSerializer } from "../../backend/serializers.js";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

const PAGE_SIZE = 24;
const STATIC_QUERY_MAPPING: Record<string, z.ZodEffects<any, string, any>> = {
    min_price: z.coerce
        .number()
        .min(1)
        .transform((value) => `PRICE >= ${value}`),
    max_price: z.coerce
        .number()
        .min(1)
        .transform((value) => `PRICE <= ${value}`),
    name: z
        .string()
        .min(1)
        .transform((value) => `LIKE %${value}%`),
};

const SORT_MAPPING: Record<string, string> = {
    newest: "id DESC",
    price_asc: "price ASC",
    price_desc: "price DESC",
    name: "name ASC",
};

export default async function list(request: Request, response: Response) {
    const pageIndex = request.body.page_index ?? 1;
    const { sort, ...requestQuery } = request.query;
    let sortStatement;
    if (sort == null) {
        sortStatement = "id DESC";
    } else {
        sortStatement = SORT_MAPPING[sort as string] ?? "id DESC";
    }

    let queryParams = Object.entries(requestQuery).map(([key, value]) => ({ key, value }));
    queryParams = [...queryParams.filter(({ key, value }) => value !== "")];

    const filters = queryParams.reduce<string[]>((acc, { key, value }) => {
        if (STATIC_QUERY_MAPPING.hasOwnProperty(key)) {
            try {
                const statement = STATIC_QUERY_MAPPING[key].parse(value);
                acc.push(statement);
            } catch {
                return acc;
            }
        } else {
            acc.push(`JSON_CONTAINS(specification, '["${key}", "${value}"]')`);
        }
        return acc;
    }, []);

    const filterStatement = filters.length === 0 ? "" : `WHERE ${filters.join(" AND ")}`;

    const count = await dbOperation(async (connection) => {
        const [countQuery] = await connection.execute<[{ total_count: number } & RowDataPacket]>(
            `SELECT COUNT(1) as total_count FROM product ${filterStatement}`,
        );

        return countQuery[0].total_count;
    });
    const results = await dbOperation(async (connection) => {
        const [productQuery] = await connection.execute<DatabaseProduct[]>(
            `SELECT * FROM product ${filterStatement} ORDER BY ${sortStatement} LIMIT ? OFFSET ?`,
            [PAGE_SIZE, PAGE_SIZE * (pageIndex - 1)],
        );

        return productQuery;
    });

    response.status(200).json({
        results: z.array(productSerializer).parse(results),
        count,
    });
}
