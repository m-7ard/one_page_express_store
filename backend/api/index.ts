import express from "express";
import { router as usersRouter } from "./users/index.js";
import { router as productsRouter } from "./products/index.js";
export const router = express.Router();
router.use("/users", usersRouter);
router.use("/products", productsRouter);
