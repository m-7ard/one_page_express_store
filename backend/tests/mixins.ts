import { DatabaseProduct, DatabaseUser } from "../backend/database_types.js";
import { createProduct, createUser } from "./_utils.js";

interface UserData {
    ADMIN_1: DatabaseUser;
    ADMIN_2: DatabaseUser;
    CUSTOMER_1: DatabaseUser;
}

interface ProductData {
    ADMIN_1__PRODUCT_1: DatabaseProduct;
    ADMIN_2__PRODUCT_1: DatabaseProduct;
    ADMIN_2__PRODUCT_2: DatabaseProduct;
}

export async function usersMixin(): Promise<UserData> {
    const ADMIN_1 = await createUser({ username: "admin_one", is_admin: true, password: "adminword" });
    const ADMIN_2 = await createUser({ username: "admin_two", is_admin: true, password: "adminword" });
    const CUSTOMER_1 = await createUser({ username: "customer_one", is_admin: false, password: "userword" });

    return { ADMIN_1, ADMIN_2, CUSTOMER_1 };
}

export async function productsMixin({ users }: { users: UserData }): Promise<ProductData> {
    const ADMIN_1__PRODUCT_1 = await createProduct({
        name: "Test User Product",
        description: "Test User Desc",
        price: 999,
        kind: "Tea",
        specification: [
            ["building", "tall"],
            ["chicken", "coop"],
        ],
        existingImages: [],
        user_id: users.ADMIN_1.id,
    });
    const ADMIN_2__PRODUCT_1 = await createProduct({
        name: "Test User Product",
        description: "Test User Desc",
        price: 1,
        kind: "Tea",
        specification: [
            ["building", "tall"],
            ["flavour", "sweet"],
        ],
        existingImages: [],
        user_id: users.ADMIN_2.id,
    });
    const ADMIN_2__PRODUCT_2 = await createProduct({
        name: "Test User Product 2",
        description: "Test User Desc",
        price: 555,
        kind: "Tea",
        specification: [
            ["building", "short"],
            ["flavour", "sweet"],
        ],
        existingImages: [],
        user_id: users.ADMIN_2.id,
    });
    
    return { ADMIN_1__PRODUCT_1, ADMIN_2__PRODUCT_1, ADMIN_2__PRODUCT_2 };
}
