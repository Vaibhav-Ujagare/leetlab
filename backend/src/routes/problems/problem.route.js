import { Router } from "express";
import { isLoggedIn, isAdmin } from "../../middleware/auth.middleware.js";
import {
  createProblem,
  deleteProblemById,
  getAllProblems,
  getAllProblemsSolvedByUser,
  getProblemById,
  updateProblemById,
} from "./problem.controller.js";

const problemRoutes = Router();

problemRoutes.post("/create-problem", isLoggedIn, isAdmin, createProblem);

problemRoutes.get("/get-all-problems", isLoggedIn, getAllProblems);

problemRoutes.get("/get-problem/:id", isLoggedIn, getProblemById);

problemRoutes.put("/update-problem/:id", isLoggedIn, updateProblemById);

problemRoutes.delete(
  "/delete-problem/:id",
  isLoggedIn,
  isAdmin,
  deleteProblemById
);

problemRoutes.get(
  "/get-solved-problems",
  isLoggedIn,
  getAllProblemsSolvedByUser
);

export default problemRoutes;
