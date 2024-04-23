import { verifyRequestOrigin } from "lucia";
import ejs from "ejs";
import express from "express";
import { router as APIrouter } from "../api/index.js";
import path from "path";
import { BASE_DIR } from "./settings.js";
import filters from "../filters.json" assert { type: "json" };

export async function setUpApp() {
    const app = express();
    const port = 3001;
    const router = express.Router();
    const { lucia } = await import ('../lib/auth.js');

    // Lucia Auth
    app.use(async (req, res, next) => {
        const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
        if (!sessionId) {
            res.locals.user = null;
            res.locals.session = null;
            return next();
        }

        const { session, user } = await lucia.validateSession(sessionId);
        if (session && session.fresh) {
            res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
        }
        if (!session) {
            res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
        }
        res.locals.session = session;
        res.locals.user = user;
        return next();
    });

    app.use((req, res, next) => {
        if (req.method === "GET") {
            return next();
        }
        const originHeader = req.headers.origin ?? null;
        const hostHeader = req.headers.host ?? null;
        if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
            return res.status(403).end();
        }
        return next();
    });

    // Response Logger
    app.use((req, res, next) => {
        res.on("finish", function () {
            const timestamp = `\x1b[33m${new Date().toLocaleTimeString()}\x1b[0m`;
            const statusCode = `\x1b[34m${res.statusCode}\x1b[0m`;
            const method = req.method;
            const url = req.originalUrl || req.url;
            const logMessage = `[${timestamp}] ${method} ${url} ${statusCode}`;
            console.log(logMessage);
        });
        next();
    });

    // Static server files
    app.use("/media", express.static("media"));
    app.use("/static", express.static("static"));

    // Rendering / Including variables
    app.engine("html", ejs.renderFile);

    // SPA vite frontend files
    app.use("/assets", express.static(path.join(BASE_DIR, "frontend", "dist/assets")));
    app.get(/^(?!\/api|\/media).*$/, async (req, res, next) => {
        res.render(path.join(BASE_DIR, "frontend", "dist", "index.html"), { filters: JSON.stringify(filters) });
    });

    // Modern Express Parsers
    app.use(express.json({ limit: 1028 ** 2 * 100 }));
    app.use(express.urlencoded({ extended: false }));

    // API
    router.use("/api", APIrouter);

    // App Routing
    app.use(router);

    return app;
}
