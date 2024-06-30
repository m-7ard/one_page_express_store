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
    available: number;
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

export interface DatabaseOrder extends RowDataPacket {
    id: number;
    user_id: DatabaseUser["id"] | null;
    product_id: DatabaseProduct["id"] | null;
    amount: number;
    date_created: string;
    archive: string;
    shipping_name: string;
    shipping_address_primary: string;
    shipping_address_secondary: string;
    shipping_city: string;
    shipping_state: string;
    shipping_zip: string;
    shipping_country: string;
    status: "pending" | "shipping" | "completed" | "canceled" | "refunded";
}

export interface DatabaseOrderShipping extends RowDataPacket {
    id: number;
    order_id: DatabaseOrder["id"] | null;
    tracking_number: string;
    courier_name: string;
    additional_information: string;
    date_created: string;
}

