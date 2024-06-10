import { Request, Response } from "express";
import {  getFilterStatement, getPaginatedQuery, getSortStatement, mysqlGetQuery, routeWithErrorHandling } from "../../backend/utils.js";
import { z } from "zod";
import { orderSerializer } from "../../backend/serializers.js";
import { orderSchema } from "../../backend/schemas.js";
import sql, { join } from "sql-template-tag";

const list = routeWithErrorHandling(async (request: Request, response: Response) => {
    const { query } = request;
    const validation = z.record(z.string()).safeParse(query);
    if (!validation.success) {
        response.status(400).json(validation.error.flatten());
        return;
    }

    const { sort, page_index, ...filters } = validation.data;
    const pageIndex = parseInt(page_index ?? "1");
    
    const filterStatement = getFilterStatement({ 
        filters,  
        filterMapping: {
            status: orderSchema.shape.status.transform((value) => sql`status LIKE ${value}`),
        }
    });

    const sortStatement = getSortStatement({
        sort,
        sortMapping: {
            date_created_asc: "date_created ASC",
            date_created_desc: "date_created DESC",
        },
        defaultSort: 'date_created_desc'
    });

    const sqlQuery = join([filterStatement, sortStatement], ' ');

    const paginatedQuery = await getPaginatedQuery({
        prefix: (fields='*') => `SELECT ${fields} FROM _order`,
        queryString: sqlQuery.sql,
        queryArgs: sqlQuery.values,
        pageIndex: pageIndex,
        pageSize: 24
    });
            
    response.status(200).json({
        ...paginatedQuery,
        results: z.array(orderSerializer).parse(paginatedQuery.results),
    });
});

export default list;
