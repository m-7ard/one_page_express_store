import mysql, { RowDataPacket } from "mysql2/promise";


export const pool = mysql.createPool({
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
});

export interface DatabaseUser extends RowDataPacket {
	id: string;
	username: string;
	password: string;
    is_admin: number;
}
