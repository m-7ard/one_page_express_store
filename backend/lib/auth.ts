import { Lucia } from "lucia";
import { Mysql2Adapter } from "@lucia-auth/adapter-mysql";
import type { DatabaseUser } from "./db.js";
import { getFromContext } from "../backend/context.js";

const adapter = new Mysql2Adapter(getFromContext('pool'), {
	user: "user",
	session: "user_session"
});

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === "production"
		}
	},
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
            is_admin: attributes.is_admin
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: Omit<DatabaseUser, "id">;
	}
}
