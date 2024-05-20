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

const checkout = routeWithErrorHandling(async (request: Request, response: Response) => {

})

export default checkout;