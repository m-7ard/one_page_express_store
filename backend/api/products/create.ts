import { ResultSetHeader } from "mysql2/promise";
import { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import { BASE_DIR } from "../../backend/settings.js";
import { DatabaseProduct } from "../../backend/database_types.js";
import { productSerializer } from "../../backend/serializers.js";
import { productSchema } from "../../backend/schemas.js";
import { getImages } from "./_utils.js";
import { dbOperation, mysqlGetOrThrow, routeWithErrorHandling } from "../../backend/utils.js";

const create = routeWithErrorHandling(async (request: Request, response: Response) => {
    if (response.locals.user == null || response.locals.user.is_admin === false) {
        response.status(403).send();
        return;
    }

    await dbOperation(async (connection) => {
        const { newImages, existingImages } = getImages(request);
        const validation = await productSchema.safeParseAsync({ ...request.body, newImages, existingImages });

        if (validation.success) {
            const cleanedData = validation.data;
            const savedFileNames = await Promise.all(
                cleanedData.newImages.map(async ({ index, file }) => {
                    const id = nanoid();
                    const fileName = `${id}-${file.originalname}`;
                    await writeFile(`${BASE_DIR}/backend/media/${fileName}`, file.buffer);
                    return { index, fileName };
                }),
            );

            const fileNames = [...savedFileNames, ...existingImages]
                .sort((a, b) => a.index - b.index)
                .map(({ fileName }) => fileName);

            const [result] = await connection.execute<ResultSetHeader>({
                sql: `INSERT INTO PRODUCT (name, description, price, kind, specification, images, user_id) 
                    VALUES (:name, :description, :price, :kind, :specification, :images, :user_id)`,
                values: {
                    name: cleanedData.name,
                    description: cleanedData.description,
                    price: cleanedData.price,
                    kind: cleanedData.kind,
                    specification: JSON.stringify(cleanedData.specification),
                    images: JSON.stringify(fileNames),
                    user_id: response.locals.user?.id
                },
                namedPlaceholders: true,
            });
            const product = await mysqlGetOrThrow<DatabaseProduct>(
                connection.execute(`SELECT * FROM product WHERE id = ?`, [result.insertId]),
            );
            return response.status(201).json(productSerializer.parse(product));
        } else {
            return response.status(400).json(validation.error.flatten());
        }
    });
})

export default create;
