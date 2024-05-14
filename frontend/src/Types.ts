export interface UserType {
    id: string;
	username: string;
    is_admin: boolean;
}

export interface CartType {
    id: number;
    products: ProductType[];
    user_id: UserType['id'];
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

export interface PaginatedQuery<T> {
    results: T[]
    count: number
    nextPage: number | undefined;
    previousPage: number | undefined;
}
