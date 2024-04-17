import { NextFunction, Request, Response } from "express";
import { userSerializer } from "../../backend/serializers.js";

export default async function user(request: Request, response: Response, next: NextFunction) {
    if (response.locals.user == null) {
        return response.status(403).send();
    }
    return response.status(200).json(userSerializer.parse(response.locals.user));
}
