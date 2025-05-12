import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  verifyEmail,
} from "./auth.controller.js";
import { isLoggedIn } from "../../middleware/auth.middleware.js";

const authRoutes = Router();

authRoutes.post("/register", registerUser);

authRoutes.post("/login", loginUser);

authRoutes.get("/logout", isLoggedIn, logoutUser);

authRoutes.post("/refresh-token", refreshAccessToken);

authRoutes.get("/verify/:token", verifyEmail);

export default authRoutes;
