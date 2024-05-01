import express, { NextFunction, Request, Response } from "express";
import create from "./create.js";
import multer, { MulterError } from "multer";
import list from "./list.js";
import edit from "./edit.js";
import drop from "./drop.js";
import { PRODUCT } from "../../backend/constants.js";
import { z } from "zod";
const upload = multer();

const uploadConfig = upload.fields(
    Array.from({ length: 12 }).map((_, i) => ({
        name: `image-${i}`,
        maxCount: PRODUCT.MAX_IMAGES_LENGTH,
    })),
);

function uploadConfigMiddleware(config: (req: Request, res: Response, next: (error?: any) => void) => void) {
    return function(request: Request, response: Response, next: NextFunction) {
        try {
            config(request, response, function(error?: any) {
                if (error) {
                    if (error instanceof multer.MulterError && error.code === 'LIMIT_UNEXPECTED_FILE') {
                        const errors: z.typeToFlattenedError<Record<string, string>> = {
                            formErrors: [],
                            fieldErrors: {
                                'images': [`Cannot upload more than ${PRODUCT.MAX_IMAGES_LENGTH} images.`]
                            }
                        };
                        response.status(400).json(errors);
                        return;
                    };

                    response.status(500).send();
                    return;
                } else {
                    next();
                }
            });
        } catch (error) {
            console.log('Error occurred:', error);
            response.status(500).send();
        }
    };
}

export const router = express.Router();
router.post("/create", uploadConfigMiddleware(uploadConfig), create);
router.get("/list", list);
router.put("/edit/:id", uploadConfigMiddleware(uploadConfig), edit);
router.post("/delete/:id", drop);
