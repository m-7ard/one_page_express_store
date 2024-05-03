import { DatabaseProduct, DatabaseUser } from "../backend/database_types.js";
import { createProduct, createUser } from "./_utils.js";

interface UserData {
    adminOneUser: DatabaseUser;
    adminTwoUser: DatabaseUser;
    customerOneUser: DatabaseUser;
}

interface ProductData {
    adminOneUserProduct_ONE: DatabaseProduct;
    adminTwoUserProduct_ONE: DatabaseProduct;
    adminTwoUserProduct_TWO: DatabaseProduct;
}

export async function usersMixin(): Promise<UserData> {
    const adminOneUser = await createUser({ username: "admin_one", is_admin: true, password: "adminword" });
    const adminTwoUser = await createUser({ username: "admin_two", is_admin: true, password: "adminword" });
    const customerOneUser = await createUser({ username: "customer_one", is_admin: false, password: "userword" });

    return { adminOneUser, adminTwoUser, customerOneUser };
}

export async function productsMixin({ users }: { users: UserData }): Promise<ProductData> {
    const adminOneUserProduct_ONE = await createProduct({
        name: "Test User Product",
        description: "Test User Desc",
        price: 999,
        kind: "Tea",
        specification: [
            ["building", "tall"],
            ["chicken", "coop"],
        ],
        images: [],
        user_id: users.adminOneUser.id,
    });
    const adminTwoUserProduct_ONE = await createProduct({
        name: "Test User Product",
        description: "Test User Desc",
        price: 1,
        kind: "Tea",
        specification: [
            ["building", "tall"],
            ["flavour", "sweet"],
        ],
        images: [],
        user_id: users.adminTwoUser.id,
    });
    const adminTwoUserProduct_TWO = await createProduct({
        name: "Test User Product 2",
        description: "Test User Desc",
        price: 555,
        kind: "Tea",
        specification: [
            ["building", "short"],
            ["flavour", "sweet"],
        ],
        images: [],
        user_id: users.adminTwoUser.id,
    });
    
    return { adminOneUserProduct_ONE, adminTwoUserProduct_ONE, adminTwoUserProduct_TWO };
}
