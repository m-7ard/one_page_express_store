import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Request, Response } from "express";
import { dbOperation, mysqlGetOrThrow, routeWithErrorHandling } from "../../backend/utils.js";
import { rm } from "fs/promises";
import { DatabaseProduct } from "../../backend/database_types.js";
import { productSerializer } from "../../backend/serializers.js";

const drop = routeWithErrorHandling(async (request: Request, response: Response) => {
    if (response.locals.user == null || response.locals.user.is_admin === false) {
        response.status(403).send();
        return;
    }

    await dbOperation(async (connection) => {
        const product = productSerializer.parse(
            await mysqlGetOrThrow<DatabaseProduct>(
                connection.execute(`SELECT * FROM product WHERE id = ?`, [request.params.id]),
            ),
        );
        await Promise.all(
            product.images.map(async (image) => {
                await rm(`media/${image}`);
            }),
        );
        const [result] = await connection.execute<ResultSetHeader>(`DELETE FROM product WHERE id = ?`, [
            parseInt(request.params.id),
        ]);
        response.status(200).json({ affectedRows: result.affectedRows });
    });
})

export default drop;
