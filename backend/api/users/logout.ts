import { Request, Response } from "express";
import { lucia } from "../../lib/auth.js";

export default async function logout(request: Request, response: Response) {
    if (!response.locals.session) {
        return response.status(401).end();
    }
    await lucia.invalidateSession(response.locals.session.id);
    return response.setHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize()).status(200).send();
}
