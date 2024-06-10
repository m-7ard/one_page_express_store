import { Request, Response } from "express";
import { DatabaseProduct } from "../../backend/database_types.js";
import { productSerializer } from "../../backend/serializers.js";
import { productSchema } from "../../backend/schemas.js";
import { getImages } from "./_utils.js";
import { dbOperation, mysqlQueryTableByID, routeWithErrorHandling } from "../../backend/utils.js";
import { Product } from "../../backend/managers.js";
import { getFromContext } from "../../backend/context.js";

const edit = routeWithErrorHandling(async (request: Request, response: Response) => {
    const user = response.locals.user;
    if (user == null || user.is_admin === false) {
        response.status(403).send();
        return;
    }

    const pool = getFromContext('pool');
    const { newImages, existingImages } = getImages(request);
    const validation = await productSchema
        .partial()
        .required({ id: true })
        .refine(
            async (values) => {
                const [productQuery] = await pool.execute<DatabaseProduct[]>(
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

    response.status(200).json(productSerializer.parse(product));
});

export default edit;
