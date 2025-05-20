import { Router } from "express";
import { isLoggedIn } from "../../middleware/auth.middleware.js";
import {
  getAllSubmission,
  getAllSubmissionForProblem,
  getSubmissionForProblem,
} from "./submission.controller.js";

const submissionRoute = Router();

submissionRoute.get("/get-all-submissions", isLoggedIn, getAllSubmission);
submissionRoute.get(
  "/get-submissions/:problemId",
  isLoggedIn,
  getSubmissionForProblem
);
submissionRoute.get(
  "/get-submissions-count/:problemId",
  isLoggedIn,
  getAllSubmissionForProblem
);

export default submissionRoute;
