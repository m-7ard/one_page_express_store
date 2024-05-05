import { createSessionCookie, objectToFormData, test, testCase } from "./_utils.js";
import { userSerializer } from "../backend/serializers.js";
import assert from "assert";
import { z } from "zod";
import { productsMixin, usersMixin } from "./mixins.js";
import { fileExists, mysqlGetOrNull, mysqlGetOrThrow, mysqlGetQuery } from "../backend/utils.js";
import { DatabaseProduct, DatabaseUser } from "../backend/database_types.js";
import context, { getFromContext } from "../backend/context.js";
import { env } from "process";
import { DatabaseSession } from "lucia";
import { RowDataPacket } from "mysql2/promise";

context.testsToRun = "__all__";

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
                username: users.customerOneUser.username,
                password: users.customerOneUser.password,
            }),
        });

        assert.strictEqual(response.status, 200);
        const sessionCookie = response.headers
            .getSetCookie()
            .find((cookie) => cookie.startsWith(lucia.sessionCookieName));
        assert.notEqual(sessionCookie, null);
        const sessionId = lucia.readSessionCookie(sessionCookie as string);
        const sessionQuery = await mysqlGetQuery<DatabaseSession & RowDataPacket>(
            pool.execute("SELECT * FROM user_session WHERE id = ?", [sessionId]),
        );
        assert.strictEqual(sessionQuery.length, 1);
    }, "Login With Valid Data And Create Session");

    await test(async () => {
        const customerOneUserCookie = await createSessionCookie(users.customerOneUser.id);
        const response = await fetch("http://localhost:3001/api/users/login", {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: customerOneUserCookie,
            },
        });

        assert.strictEqual(response.status, 200);
        // Check that a new session was not created
        const sessionQuery = await mysqlGetQuery<DatabaseSession & RowDataPacket>(
            pool.execute("SELECT * FROM user_session WHERE user_id = ?", [users.customerOneUser.id]),
        );
        assert.strictEqual(sessionQuery.length, 1);
        const sessionId = lucia.readSessionCookie(customerOneUserCookie)!;
        const { session, user } = await lucia.validateSession(sessionId);
        assert.deepEqual(user, await response.json());
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

        const data: z.infer<typeof userSerializer> = await response.json();
        const newUser = await mysqlGetOrNull<DatabaseUser>(pool.execute("SELECT * FROM user WHERE id = ?", [data.id]));
        const sessionCookie = response.headers
            .getSetCookie()
            .find((cookie) => cookie.startsWith(lucia.sessionCookieName));

        assert.notEqual(sessionCookie, null);
        assert.deepEqual(data, userSerializer.parse(newUser));

        const sessionQuery = await mysqlGetQuery<DatabaseSession & RowDataPacket>(
            pool.execute("SELECT * FROM user_session WHERE user_id = ?", [data.id]),
        );

        assert.strictEqual(sessionQuery.length, 1);
    }, "Register With Valid Data And Create Session");

    await test(async () => {
        const customerOneUserCookie = await createSessionCookie(users.customerOneUser.id);
        const response = await fetch("http://localhost:3001/api/users/register", {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: customerOneUserCookie,
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
        const customerOneUserCookie = await createSessionCookie(users.customerOneUser.id);
        const response = await fetch("http://localhost:3001/api/users/logout", {
            method: "POST",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: customerOneUserCookie,
            },
        });

        assert.strictEqual(response.status, 200);

        const sessionId = lucia.readSessionCookie(customerOneUserCookie)!;
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
        const customerOneUserCookie = await createSessionCookie(users.customerOneUser.id);
        const response = await fetch("http://localhost:3001/api/users/user", {
            method: "GET",
            headers: {
                Origin: env.ORIGIN as string,
                Cookie: customerOneUserCookie,
            },
        });

        assert.strictEqual(response.status, 200);

        const customerOne = await mysqlGetOrNull<DatabaseUser>(
            pool.execute("SELECT * FROM user WHERE id = ?", [users.customerOneUser.id]),
        );
        const data = await response.json();
        assert.deepEqual(userSerializer.parse(customerOne), data);
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
