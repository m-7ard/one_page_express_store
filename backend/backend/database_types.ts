import { RowDataPacket } from "mysql2/promise";

export interface DatabaseUser extends RowDataPacket {
	id: string;
	username: string;
	password: string;
    is_admin: number;
}

export interface DatabaseProduct extends RowDataPacket {
    id: number;
    name: string;
    description: string;
    price: number;
    kind: string;
    specification: string;
    images: string;
    user_id: DatabaseUser["id"];
}

export interface DatabaseCart extends RowDataPacket {
	id: number;
    user_id: DatabaseUser["id"];
}

export interface DatabaseCartProduct extends RowDataPacket {
	id: number;
    cart_id: DatabaseCart["id"];
    product_id: DatabaseProduct["id"];
    amount: number;
}
