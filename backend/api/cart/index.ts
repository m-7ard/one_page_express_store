import express from "express";
import multer from "multer";
import add_product from "./add_product.js";
import list_products from "./list_products.js";
import remove_product from "./remove_product.js";
export const router = express.Router();
const upload = multer();
router.post("/add_product/:id", upload.none(), add_product);
router.post("/list_products/", upload.none(), list_products);
router.post("/remove_product/:id", upload.none(), remove_product);

