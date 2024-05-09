import express from "express";
import multer from "multer";
import add_product from "./add_product.js";
export const router = express.Router();
const upload = multer();
router.post("/add_product/:id", upload.none(), add_product);

