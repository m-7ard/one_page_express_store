import mysql, { ResultSetHeader } from "mysql2/promise";
import { Request, Response } from "express";
import { pool } from "../../lib/db.js";
import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import { BASE_DIR } from "../../backend/settings.js";
import { DatabaseProduct } from "../../backend/database_types.js";
import { productSerializer } from "../../backend/serializers.js";
import { productSchema } from "../../backend/schemas.js";
import { getImages } from "./_utils.js";
import { dbOperation } from "../../backend/utils.js";
import { rm } from "fs/promises";

export default async function edit(request: Request, response: Response) {
    if (response.locals.user == null || response.locals.user.is_admin === false) {
        response.status(403).send();
        return;
    }

    return await dbOperation(async (connection) => {
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
            });
        if (validation.success) {
            const cleanedData = validation.data;
            
            const newExistingImages = cleanedData.existingImages.map(({ fileName }) => fileName);
            const [oldProductQuery] = await connection.execute<DatabaseProduct[]>(
                "SELECT * FROM product WHERE id = ?",
                [cleanedData.id],
            );
            const oldProduct = productSerializer.parse(oldProductQuery[0]);
            const filesForDeletion = oldProduct.images.filter((image) => !newExistingImages.includes(image));
            await Promise.all(
                filesForDeletion.map(async (image) => {
                    await rm(`media/${image}`);
                }),
            );

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
            const [result, fields] = await connection.execute<ResultSetHeader>(
                `UPDATE product
                    SET name = ?,
                        description = ?,
                        price = ?,
                        kind = ?,
                        specification = ?,
                        images = ?
                    WHERE id = ${cleanedData.id}`,
                [
                    cleanedData.name,
                    cleanedData.description,
                    cleanedData.price,
                    cleanedData.kind,
                    JSON.stringify(cleanedData.specification),
                    JSON.stringify(fileNames),
                ],
            );
            const [productQuery] = await connection.execute<DatabaseProduct[]>("SELECT * FROM product WHERE id = ?", [
                cleanedData.id,
            ]);
            const [product] = productQuery;
            return response.status(200).json(productSerializer.parse(product));
        } else {
            return response.status(400).json(validation.error.flatten());
        }
    });
}
