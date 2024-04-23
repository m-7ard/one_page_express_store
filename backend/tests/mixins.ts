import { Argon2id } from "oslo/password";
import { DatabaseUser } from "../backend/database_types.js";
import { mysqlGetOrThrow } from "../backend/utils.js";
import { getFromContext } from "../backend/context.js";
import { ResultSetHeader } from "mysql2";
import { createProduct, createUser } from "./_utils.js";

export async function usersMixin() {
    const testUser = await createUser({ username: "test_user", isAdmin: true });
    const otherUser = await createUser({ username: "other_user", isAdmin: false });

    return { testUser, otherUser };
}

export async function productsMixin({
    users,
}: {
    users: {
        testUser: DatabaseUser;
        otherUser: DatabaseUser;
    };
}) {
    const testUserProduct = await createProduct({
        name: "Test User Product",
        description: "Test User Desc",
        price: 999,
        kind: "Tea",
        specification: [
            ["building", "tall"],
            ["chicken", "coop"],
        ],
        images: ["tests/image1.jpg", "tests/image2.jpg", "tests/image3.jpg"],
        userId: users.testUser.id,
    });
    const otherUserProduct1 = await createProduct({
        name: "Test User Product",
        description: "Test User Desc",
        price: 1,
        kind: "Tea",
        specification: [
            ["building", "tall"],
            ["flavour", "sweet"],
        ],
        images: ["tests/image1.jpg", "tests/image2.jpg", "tests/image3.jpg"],
        userId: users.otherUser.id,
    });
    const otherUserProduct2 = await createProduct({
        name: "Test User Product 2",
        description: "Test User Desc",
        price: 555,
        kind: "Tea",
        specification: [
            ["building", "short"],
            ["flavour", "sweet"],
        ],
        images: ["tests/image1.jpg", "tests/image2.jpg", "tests/image3.jpg"],
        userId: users.otherUser.id,
    });
    return { testUserProduct, otherUserProduct1, otherUserProduct2 };
}
