import { Request, Response } from "express";
import {
    getFilterStatement,
    getPaginatedQuery,
    getSortStatement,
    mysqlGetQuery,
    routeWithErrorHandling,
    zodHelpers,
} from "../../backend/utils.js";
import { z } from "zod";
import { orderSerializer } from "../../backend/serializers.js";
import { orderSchema, productSchema } from "../../backend/schemas.js";
import sql, { join } from "sql-template-tag";

/* TODO: make filters */

const list = routeWithErrorHandling(async (request: Request, response: Response) => {
    const { query } = request;
    const validation = z.record(z.string()).safeParse(query);
    if (!validation.success) {
        response.status(400).json(validation.error.flatten());
        return;
    }

    const { sort, page_index, ...filters } = validation.data;
    const pageIndex = parseInt(page_index ?? "1");

    const jsDatetoSqlDateTimeField = (date: Date) => {
        const pad = function (num: number) {
            return ("00" + num).slice(-2);
        };

        return (
            date.getUTCFullYear() +
            "-" +
            pad(date.getUTCMonth() + 1) +
            "-" +
            pad(date.getUTCDate()) +
            " " +
            pad(date.getUTCHours()) +
            ":" +
            pad(date.getUTCMinutes()) +
            ":" +
            pad(date.getUTCSeconds())
        );
    };

    const filterStatement = getFilterStatement({
        filters,
        filterMapping: {
            status: orderSchema.shape.status.transform((value) => sql`status LIKE ${value}`),
            date_start: z.coerce.date().transform((value) => sql`date_created > CAST(${jsDatetoSqlDateTimeField(value)} AS Datetime)`),
            date_end: z.coerce.date().transform((value) => sql`date_created < CAST(${jsDatetoSqlDateTimeField(value)} AS Datetime)`),
            amount: orderSchema.shape.amount.transform((value) => sql`amount = ${value}`),
            product_name: productSchema.shape.name.transform((value) => sql`product.name LIKE CONCAT('%', ${value}, '%')`),
            client_name: orderSchema.shape.shipping_name.transform((value) => sql`shipping_name LIKE CONCAT('%', ${value}, '%')`),
            total_price: zodHelpers.coerceFiniteNumber(z.number().min(0).transform((value) => sql`amount * JSON_UNQUOTE(JSON_EXTRACT(archive, '$.product.price')) > ${value}`))
        },
    });

    const sortStatement = getSortStatement({
        sort,
        sortMapping: {
            date_created_asc: "date_created ASC",
            date_created_desc: "date_created DESC",
        },
        defaultSort: "date_created_desc",
    });


    const sqlQuery = join([filterStatement, sortStatement], " ");

    const paginatedQuery = await getPaginatedQuery({
        prefix: (fields = `
            _order.*
        `) => `
            SELECT ${fields}
                FROM 
                    _order 
                        LEFT JOIN product ON product.id = _order.product_id
        `,
        queryString: sqlQuery.sql,
        queryArgs: sqlQuery.values,
        pageIndex: pageIndex,
        pageSize: 24,
    });

    response.status(200).json({
        ...paginatedQuery,
        results: z.array(orderSerializer).parse(paginatedQuery.results),
    });
});

export default list;
