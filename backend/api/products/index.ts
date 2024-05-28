import express, { NextFunction, Request, Response } from "express";
import create from "./create.js";
import multer, { MulterError } from "multer";
import list from "./list.js";
import edit from "./edit.js";
import drop from "./drop.js";
import { PRODUCT } from "../../backend/constants.js";
const upload = multer();

// Although the actual image limit is suppose to be 12
// it is less complex to just simply let the view
// validate it through the schema
const uploadConfig = upload.fields(
    Array.from({ length: 13 }).map((_, i) => ({
        name: `image-${i}`,
        maxCount: PRODUCT.MAX_IMAGES_LENGTH,
    })),
);

export const router = express.Router();
router.post("/create", uploadConfig, create);
router.get("/list", list);
router.put("/edit/:id", uploadConfig, edit);
router.post("/delete/:id", drop);
