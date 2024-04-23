import type { User, Session } from "lucia";
import mysql from "mysql2/promise";
import context from "./context.js";

new Promise(async (resolve) => {
    const pool = mysql.createPool({
        host: process.env.HOST,
        port: process.env.PORT,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
    });

    context.pool = pool;
    const { setUpApp } = await import("./app.js");
    const app = await setUpApp();
    const server = app.listen(3001, () => {
        console.log("running");
    });
});

declare global {
    namespace Express {
        interface Locals {
            user: User | null;
            session: Session | null;
        }
    }
}
