import { Router } from "express";
import { isLoggedIn, isAdmin } from "../../middleware/auth.middleware.js";
import { executeCode } from "./codeExecution.controller.js";

const codeExecutionRoute = Router();

codeExecutionRoute.post("/", isLoggedIn, executeCode);

export default codeExecutionRoute;
