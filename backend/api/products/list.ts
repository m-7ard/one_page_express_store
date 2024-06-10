import { Request, Response } from "express";
import { dbOperation, routeWithErrorHandling } from "../../backend/utils.js";
import { DatabaseProduct } from "../../backend/database_types.js";
import { productSerializer } from "../../backend/serializers.js";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

interface ExpectedRequest extends Request {
    query: {
        sort?: keyof typeof SORT_MAPPING;
        page_index?: string;
        [filter: string]: string | undefined;
    };
}

const PAGE_SIZE = 24;

const STATIC_FILTER_MAPPING: Record<string, z.ZodEffects<any, string, any>> = {
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

const SORT_MAPPING = {
    newest: "id DESC",
    price_asc: "price ASC",
    price_desc: "price DESC",
    name: "name ASC",
};

const parseQueryParams = (query: ExpectedRequest["query"]) => {
    const { sort, page_index, ...filters } = query;
    const pageIndex = parseInt(page_index ?? "1");
    const sortStatement = sort == null ? "id DESC" : SORT_MAPPING[sort] ?? "id DESC";

    return { filters, pageIndex, sortStatement };
};

const buildFilterStatement = (filters: Record<string, string | undefined>) => {
    const queryParams = Object.entries(filters).filter(([_, value]) => value !== "");
    const filterStatements = queryParams.reduce<string[]>((acc, [key, value]) => {
        if (STATIC_FILTER_MAPPING.hasOwnProperty(key)) {
            try {
                const statement = STATIC_FILTER_MAPPING[key].parse(value);
                acc.push(statement);
            } catch {
                return acc;
            }
        } else {
            acc.push(`JSON_CONTAINS(specification, '["${key}", "${value}"]')`);
        }
        return acc;
    }, []);

    return filterStatements.length ? `WHERE ${filterStatements.join(" AND ")}` : "";
};

const getCount = async (filterStatement: string) => {
    return await dbOperation(async (connection) => {
        const [countQuery] = await connection.execute<[{ total_count: number } & RowDataPacket]>(
            `SELECT COUNT(1) as total_count FROM product ${filterStatement}`,
        );
        return countQuery[0].total_count;
    });
};

const getProducts = async (filterStatement: string, sortStatement: string, pageIndex: number) => {
    return await dbOperation(async (connection) => {
        const [productQuery] = await connection.execute<DatabaseProduct[]>(
            `SELECT * FROM product ${filterStatement} ORDER BY ${sortStatement} LIMIT ? OFFSET ?`,
            [PAGE_SIZE, PAGE_SIZE * (pageIndex - 1)],
        );
        return productQuery;
    });
};

const list = routeWithErrorHandling(async (request: Request, response: Response) => {
    const { filters, pageIndex, sortStatement } = parseQueryParams((request as ExpectedRequest).query);
    const filterStatement = buildFilterStatement(filters);

    const [count, products] = await Promise.all([
        getCount(filterStatement),
        getProducts(filterStatement, sortStatement, pageIndex)
    ]);

    response.status(200).json({
        results: z.array(productSerializer).parse(products),
        count,
        nextPage: PAGE_SIZE * pageIndex < count ? pageIndex + 1 : null,
        previousPage: pageIndex - 1 > 0 ? pageIndex - 1 : null,
    });
});


export default list;
