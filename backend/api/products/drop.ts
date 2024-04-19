import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Request, Response } from "express";
import { dbOperation } from "../../backend/utils.js";
import { rm } from "fs/promises";
import { DatabaseProduct } from "../../backend/database_types.js";
import { productSerializer } from "../../backend/serializers.js";

export default async function drop(request: Request, response: Response) {
    if (response.locals.user == null || response.locals.user.is_admin === false) {
        response.status(403).send();
        return;
    }

    return await dbOperation(async (connection) => {
        const [productQuery] = await connection.execute<DatabaseProduct[]>(`SELECT * FROM product WHERE id = ?`, [
            parseInt(request.params.id),
        ]);
        const product = productSerializer.parse(productQuery[0]);
        await Promise.all(
            product.images.map(async (image) => {
                await rm(`media/${image}`);
            }),
        );
        const [result] = await connection.execute<ResultSetHeader>(`DELETE FROM product WHERE id = ?`, [
            parseInt(request.params.id),
        ]);
        return response.status(200).json({ affectedRows: result.affectedRows });
    });
}
