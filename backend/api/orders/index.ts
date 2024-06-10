import express, { NextFunction, Request, Response } from "express";
import checkout from "./checkout.js";
import multer, { MulterError } from "multer";
import { PRODUCT } from "../../backend/constants.js";
import { z } from "zod";
import list from "./list.js";
import confirm_shipping from "./confirm_shipping.js";
import confirm_completed from "./confirm_completed.js";

export const router = express.Router();
const upload = multer();
router.post("/checkout", upload.none(), checkout);
router.get("/list", upload.none(), list);
router.put("/:id/confirm_shipping", upload.none(), confirm_shipping);
router.put("/:id/confirm_completed", upload.none(), confirm_completed);
