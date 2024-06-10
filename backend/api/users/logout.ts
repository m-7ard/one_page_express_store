import { Request, Response } from "express";
import { lucia } from "../../lib/auth.js";
import { routeWithErrorHandling } from "../../backend/utils.js";

const logout = routeWithErrorHandling(async (request: Request, response: Response) => {
    if (!response.locals.session) {
        response.status(401).end();
        return;
    }
    await lucia.invalidateSession(response.locals.session.id);
    response.setHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize()).status(200).send();
});

export default logout;
