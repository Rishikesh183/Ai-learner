import express from "express";
import signupHandler from "../controllers/signupController.js";
import loginController from "../controllers/loginController.js"; 

import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.route("/register").post(signupHandler);
router.route("/login").post(loginController);   

export default router;
