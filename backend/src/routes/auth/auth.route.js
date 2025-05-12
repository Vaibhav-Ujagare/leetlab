import { Router } from "express";
import {
  forgotPasswordRequest,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendVerificationEmail,
  resetPasswordController,
  verifyEmail,
} from "./auth.controller.js";
import { isLoggedIn } from "../../middleware/auth.middleware.js";

const authRoutes = Router();

authRoutes.post("/register", registerUser);

authRoutes.post("/login", loginUser);

authRoutes.get("/logout", isLoggedIn, logoutUser);

authRoutes.post("/refresh-token", refreshAccessToken);

authRoutes.get("/verify/:token", verifyEmail);

authRoutes.post("/verify/resend", resendVerificationEmail);

authRoutes.post("/forgot-password", forgotPasswordRequest);

authRoutes.post("/reset-password/:hashedToken", resetPasswordController);

export default authRoutes;
