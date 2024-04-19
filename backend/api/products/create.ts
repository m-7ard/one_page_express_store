import { ResultSetHeader } from "mysql2/promise";
import { Request, Response } from "express";
import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import { BASE_DIR } from "../../backend/settings.js";
import { DatabaseProduct } from "../../backend/database_types.js";
import { productSerializer } from "../../backend/serializers.js";
import { productSchema } from "../../backend/schemas.js";
import { getImages } from "./_utils.js";
import { dbOperation } from "../../backend/utils.js";

export default async function create(request: Request, response: Response) {
    if (response.locals.user == null || response.locals.user.is_admin === false) {
        response.status(403).send();
        return;
    }

    return await dbOperation(async (connection) => {
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

            const [result] = await connection.execute<ResultSetHeader>(
                "INSERT INTO product (name, description, price, kind, specification, images) VALUES (?, ?, ?, ?, ?, ?)",
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
                result.insertId,
            ]);
            const [product] = productQuery;
            return response.status(201).json(productSerializer.parse(product));
        } else {
            return response.status(400).json(validation.error.flatten());
        }
    });
}
