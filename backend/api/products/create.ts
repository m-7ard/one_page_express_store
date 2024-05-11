import { ResultSetHeader } from "mysql2/promise";
import { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import { BASE_DIR } from "../../backend/settings.js";
import { DatabaseProduct } from "../../backend/database_types.js";
import { productSerializer } from "../../backend/serializers.js";
import { productSchema } from "../../backend/schemas.js";
import { getImages } from "./_utils.js";
import { dbOperationWithRollback, mysqlGetOrThrow, routeWithErrorHandling } from "../../backend/utils.js";
import { Product } from "../../backend/managers.js";

const create = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null || user.is_admin === false) {
        response.status(403).send();
        return;
    }

    await dbOperationWithRollback(async (connection) => {
        const { newImages, existingImages } = getImages(request);
        const validation = await productSchema.safeParseAsync({
            ...request.body,
            newImages,
            existingImages,
            user_id: user.id,
        });

        if (validation.success) {
            const id = await Product.create(validation.data);
            const product = await mysqlGetOrThrow<DatabaseProduct>(
                connection.execute(`SELECT * FROM product WHERE id = ?`, [id]),
            );
            return response.status(201).json(productSerializer.parse(product));
        } else {
            return response.status(400).json(validation.error.flatten());
        }
    });
});

export default create;
