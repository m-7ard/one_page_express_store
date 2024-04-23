import { RowDataPacket } from "mysql2/promise";

export interface DatabaseProduct extends RowDataPacket {
    id: number;
    name: string;
    description: string;
    price: number;
    kind: string;
    specification: string;
    images: string;
}

export interface DatabaseUser extends RowDataPacket {
	id: string;
	username: string;
	password: string;
    is_admin: number;
}