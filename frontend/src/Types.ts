export interface UserType {
    id: string;
    username: string;
    is_admin: boolean;
}

export interface CartType {
    id: number;
    products: CartProductType[];
    user_id: UserType["id"];
}

export interface FilterType {
    field_name: string;
    field_value: string[];
}

export interface ProductType {
    id: number;
    name: string;
    description: string;
    price: number;
    kind: string;
    specification: Array<[fieldName: string, fieldValue: string]>;
    images: string[];
}

export interface CartProductType {
    id: number;
    amount: number;
    product: ProductType;
}

export interface OrderType {
    id: number;
    amount: number;
    date_created: string;
    archive: {
        product: ProductType;
    };
    shipping_name: string;
    shipping_address_primary: string;
    shipping_address_secondary: string;
    shipping_city: string;
    shipping_state: string;
    shipping_zip: string;
    shipping_country: string;
    status: "pending" | "shipping" | "completed" | "presumed_completed" | "canceled" | "refunded";
}

export interface PaginatedQuery<T> {
    results: T[];
    count: number;
    nextPage: number | undefined;
    previousPage: number | undefined;
}

export interface OrderShippingType {
    id: number;
    date_created: string;
    tracking_number: string;
    courier_name: string;
    additional_information: string;
    order_id: OrderType["id"] | null;
}