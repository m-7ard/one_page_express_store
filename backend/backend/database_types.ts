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
