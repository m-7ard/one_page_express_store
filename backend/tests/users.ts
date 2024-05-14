import { createSessionCookie, objectToFormData, test, testCase } from "./_utils.js";
import { cartSerializer, userSerializer } from "../backend/serializers.js";
import assert from "assert";
import { z } from "zod";
import { usersMixin } from "./mixins.js";
import { mysqlGetOrNull, mysqlGetOrThrow, mysqlGetQuery } from "../backend/utils.js";
import { DatabaseCart, DatabaseProduct, DatabaseUser } from "../backend/database_types.js";
import context, { getFromContext } from "../backend/context.js";
import { env } from "process";
import { DatabaseSession } from "lucia";
import { RowDataPacket } from "mysql2/promise";

context.testsToRun = "__all__";

type UsersUserApiResponseData = {
    user: z.output<typeof userSerializer>;
    cart: z.output<typeof cartSerializer>;
};

testCase(async () => {
    const { lucia } = await import("../lib/auth.js");
    const pool = getFromContext("pool");
    const users = await usersMixin();

    // const adminOneUserCookie = await createSessionCookie(users.adminOneUser.id);

    await test(async () => {
        const response = await fetch("http://localhost:3001/api/users/login", {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
            },
            body: objectToFormData({
                username: users.CUSTOMER_1.username,
                password: users.CUSTOMER_1.password,
            }),
        });

        assert.strictEqual(response.status, 200);

        const sessionCookie = response.headers
            .getSetCookie()
            .find((cookie) => cookie.startsWith(lucia.sessionCookieName));
        assert.notEqual(sessionCookie, null);

        const sessionId = lucia.readSessionCookie(sessionCookie as string)!;
        const sessionQuery = await mysqlGetQuery<DatabaseSession & RowDataPacket>(
            pool.execute("SELECT * FROM user_session WHERE id = ?", [sessionId]),
        );
        assert.strictEqual(sessionQuery.length, 1);

        const { session, user } = await lucia.validateSession(sessionId);
        const data: UsersUserApiResponseData = await response.json();
        const cart = await mysqlGetOrThrow<DatabaseCart>(
            pool.execute("SELECT * FROM cart WHERE user_id = ?", [data.user.id]),
        );
        assert.deepStrictEqual(data, {
            user: user,
            cart: await cartSerializer.parseAsync(cart),
        });
    }, "Login With Valid Data And Create Session");

    await test(async () => {
        const CUSTOMER_1_COOKIE = await createSessionCookie(users.CUSTOMER_1.id);
        const response = await fetch("http://localhost:3001/api/users/login", {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: CUSTOMER_1_COOKIE,
            },
        });
        assert.strictEqual(response.status, 200);

        // Check that a new session was not created
        const sessionQuery = await mysqlGetQuery<DatabaseSession & RowDataPacket>(
            pool.execute("SELECT * FROM user_session WHERE user_id = ?", [users.CUSTOMER_1.id]),
        );
        assert.strictEqual(sessionQuery.length, 1);

        const sessionId = lucia.readSessionCookie(CUSTOMER_1_COOKIE)!;
        const { session, user } = await lucia.validateSession(sessionId);
        const data: UsersUserApiResponseData = await response.json();
        const cart = await mysqlGetOrThrow<DatabaseCart>(
            pool.execute("SELECT * FROM cart WHERE user_id = ?", [data.user.id]),
        );
        assert.deepStrictEqual(data, {
            user: user,
            cart: await cartSerializer.parseAsync(cart),
        });
    }, "Skip Login When Already Logged In");

    await test(async () => {
        const response = await fetch("http://localhost:3001/api/users/register", {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
            },
            body: objectToFormData({
                username: "new_user",
                password: "userword",
            }),
        });

        assert.strictEqual(response.status, 201);

        const data: UsersUserApiResponseData = await response.json();
        const newUser = await mysqlGetOrNull<DatabaseUser>(
            pool.execute("SELECT * FROM user WHERE id = ?", [data.user.id]),
        );
        const sessionCookie = response.headers
            .getSetCookie()
            .find((cookie) => cookie.startsWith(lucia.sessionCookieName));

        assert.notEqual(sessionCookie, null);
        assert.deepStrictEqual(data.user, userSerializer.parse(newUser));

        const sessionQuery = await mysqlGetQuery<DatabaseSession & RowDataPacket>(
            pool.execute("SELECT * FROM user_session WHERE user_id = ?", [data.user.id]),
        );

        assert.strictEqual(sessionQuery.length, 1);

        const cart = await mysqlGetOrThrow<DatabaseCart>(
            pool.execute("SELECT * FROM cart WHERE user_id = ?", [data.user.id]),
        );

        assert.deepStrictEqual(data.cart, await cartSerializer.parseAsync(cart));
    }, "Register With Valid Data And Create Session");

    await test(async () => {
        const CUSTOMER_1_COOKIE = await createSessionCookie(users.CUSTOMER_1.id);
        const response = await fetch("http://localhost:3001/api/users/register", {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: CUSTOMER_1_COOKIE,
            },
            body: objectToFormData({
                username: "new_user",
                password: "userword",
            }),
        });
        assert.strictEqual(response.status, 403);
        const newUser = await mysqlGetOrNull<DatabaseUser>(
            pool.execute("SELECT * FROM user WHERE username = ?", ["new_user"]),
        );
        assert.equal(newUser, null);
    }, "Fail To Register When Already Logged In");

    await test(async () => {
        const CUSTOMER_1_COOKIE = await createSessionCookie(users.CUSTOMER_1.id);
        const response = await fetch("http://localhost:3001/api/users/logout", {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: CUSTOMER_1_COOKIE,
            },
        });

        assert.strictEqual(response.status, 200);

        const sessionId = lucia.readSessionCookie(CUSTOMER_1_COOKIE)!;
        const { session, user } = await lucia.validateSession(sessionId);

        assert.equal(session, null);
        assert.equal(user, null);
    }, "Logout When Logged In");

    await test(async () => {
        const response = await fetch("http://localhost:3001/api/users/logout", {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
            },
        });

        assert.strictEqual(response.status, 401);
    }, "Fail To Logout When Not Logged In");

    await test(async () => {
        const CUSTOMER_1_COOKIE = await createSessionCookie(users.CUSTOMER_1.id);
        const response = await fetch("http://localhost:3001/api/users/user", {
            method: "GET",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: CUSTOMER_1_COOKIE,
            },
        });

        assert.strictEqual(response.status, 200);

        const customerOne = await mysqlGetOrThrow<DatabaseUser>(
            pool.execute("SELECT * FROM user WHERE id = ?", [users.CUSTOMER_1.id]),
        );
        const customerOneCart = await mysqlGetOrThrow<DatabaseCart>(
            pool.execute("SELECT * FROM cart WHERE user_id = ?", [customerOne.id]),
        );
        const data = await response.json();
        assert.deepStrictEqual(data, {
            user: userSerializer.parse(customerOne),
            cart: await cartSerializer.parseAsync(customerOneCart)
        });
    }, "Get User Data When Logged In");

    await test(async () => {
        const response = await fetch("http://localhost:3001/api/users/user", {
            method: "GET",
            headers: {
                Origin: env.ORIGIN as string,
            },
        });

        assert.strictEqual(response.status, 403);
    }, "Fail To Get User Data When Logged In");
});
