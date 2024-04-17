import mysql, { ResultSetHeader } from "mysql2/promise";
import { Request, Response, query } from "express";
import { pool } from "../../lib/db.js";
import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import { BASE_DIR } from "../../backend/settings.js";
import { DatabaseProduct } from "../../backend/database_types.js";
import { productSerializer } from "../../backend/serializers.js";
import { productSchema } from "../../backend/schemas.js";
import { getImages } from "./_utils.js";
import { dbOperation } from "../../backend/utils.js";

export default async function drop(request: Request, response: Response) {
    if (response.locals.user == null || response.locals.user.is_admin === false) {
        response.status(403).send();
        return;
    }

    return await dbOperation(async (connection) => {
            const [result] = await connection.execute<ResultSetHeader>(
                `DELETE FROM product WHERE id = ?`,
                [parseInt(request.params.id)]
            );
            return response.status(200).json({ id: 1 });
        }
    );
}
