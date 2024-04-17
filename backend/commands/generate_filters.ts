import { writeFile } from "fs/promises";
import { pool } from "../lib/db.js";
import { RowDataPacket } from "mysql2/promise";
import path from "path";
import { BASE_DIR } from "../backend/settings.js";

export interface Filter extends RowDataPacket {
    field_name: string;
    field_value: string[];
}

export async function generate_filters() {
    const [filtersQuery, fields] = await pool.query<Filter[]>(`
        SELECT jt.field_name, JSON_ARRAYAGG(DISTINCT jt.field_values) AS field_value 
            FROM product CROSS JOIN JSON_TABLE(
                product.specification,
                '$[*]' COLUMNS (
                    field_name VARCHAR(255) PATH '$[0]',
                    field_values VARCHAR(255) PATH '$[1]'
                )
            ) AS jt
        GROUP BY jt.field_name
    `);
    await writeFile(path.join(BASE_DIR, "backend/filters.json"), JSON.stringify(filtersQuery));
    return filtersQuery;
}

generate_filters().then((value) => {
    console.log(`\x1b[34m${'[FINISHED]'}\x1b[0m`, value);
}).finally(process.exit);
