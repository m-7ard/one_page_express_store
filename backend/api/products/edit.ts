import mysql, { ResultSetHeader } from "mysql2/promise";
import { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import { BASE_DIR } from "../../backend/settings.js";
import { DatabaseProduct } from "../../backend/database_types.js";
import { productSerializer } from "../../backend/serializers.js";
import { productSchema } from "../../backend/schemas.js";
import { getImages } from "./_utils.js";
import { dbOperationWithRollback, mysqlQueryTableByID, routeWithErrorHandling } from "../../backend/utils.js";
import { rm } from "fs/promises";
import { Product } from "../../backend/managers.js";

export default routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null || user.is_admin === false) {
        response.status(403).send();
        return;
    }

    await dbOperationWithRollback(async (connection) => {
        const { newImages, existingImages } = getImages(request);
        const validation = await productSchema
            .required()
            .refine(
                async (values) => {
                    const [productQuery] = await connection.execute<DatabaseProduct[]>(
                        `SELECT * FROM product WHERE id = ?`,
                        [values.id],
                    );
                    const [product] = productQuery;
                    return existingImages.every(({ fileName }) => product.images.includes(fileName));
                },
                { message: "Attempting to add saved image/s that don't exist on product." },
            )
            .safeParseAsync({
                id: request.params.id,
                ...request.body,
                newImages,
                existingImages,
                user_id: user.id,
            });
        if (!validation.success) {
            response.status(400).json(validation.error.flatten());
            return;
        }

        await Product.update(validation.data);
        const [product] = await mysqlQueryTableByID({
            table: "product",
            id: validation.data.id,
        });
        return response.status(200).json(productSerializer.parse(product));
    });
    return;
});
