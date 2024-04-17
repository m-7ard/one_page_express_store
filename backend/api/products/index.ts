import express from "express";
import create from "./create.js";
import multer from "multer";
import list from "./list.js";
import edit from "./edit.js";
import drop from "./drop.js";
const upload = multer();

const uploadConfig = upload.fields(
    Array.from({ length: 12 }).map((_, i) => ({
        name: `image-${i}`,
        maxCount: 12,
    })),
);

export const router = express.Router();
router.post("/create", uploadConfig, create);
router.get("/list", list);
router.put("/edit/:id", uploadConfig, edit);
router.post("/delete/:id", drop);
