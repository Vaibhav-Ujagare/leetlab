import { db } from "../../libs/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { Difficulty } from "../../generated/prisma/index.js";

export const createProblem = asyncHandler(async (req, res) => {});
export const getAllProblems = asyncHandler(async (req, res) => {});
export const getProblemById = asyncHandler(async (req, res) => {});
export const updateProblemById = asyncHandler(async (req, res) => {});
export const deleteProblemById = asyncHandler(async (req, res) => {});
export const getAllProblemsSolvedByUser = asyncHandler(async (req, res) => {});
