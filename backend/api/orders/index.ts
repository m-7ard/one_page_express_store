import express, { NextFunction, Request, Response } from "express";
import checkout from "./checkout.js";
import multer, { MulterError } from "multer";
import { PRODUCT } from "../../backend/constants.js";
import { z } from "zod";

export const router = express.Router();
const upload = multer();
router.post("/checkout", upload.none(), checkout);