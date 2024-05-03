import express from "express";
import register from "./register.js";
import login from "./login.js";
import user from "./user.js";
import logout from "./logout.js";
import multer from "multer";
export const router = express.Router();
const upload = multer();
router.post("/register", upload.none(), register);
router.post("/login", upload.none(), login);
router.get("/user", upload.none(), user);
router.post("/logout", upload.none(), logout);
