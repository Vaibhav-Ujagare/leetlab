import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "./auth.controller.js";
import { isLoggedIn } from "../../middleware/auth.middleware.js";

const authRoutes = Router();

authRoutes.post("/register", registerUser);

authRoutes.post("/login", loginUser);

authRoutes.get("/logout", isLoggedIn, logoutUser);

export default authRoutes;
