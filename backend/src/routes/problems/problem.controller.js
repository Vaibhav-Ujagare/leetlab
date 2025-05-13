import { db } from "../../libs/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { Difficulty } from "../../generated/prisma/index.js";
import {
  getJudge0LanguageId,
  pollBatchResults,
  submitBatch,
} from "../../libs/judge0.lib.js";

export const createProblem = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    examples,
    constraints,
    hints,
    editorial,
    testCases,
    codeSnippets,
    referenceSolutions,
  } = req.body;

  if (req.user.role !== "ADMIN") {
    throw new ApiError(401, "You are not allowed to create a problem");
  }

  try {
    for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
      const languageId = getJudge0LanguageId(language);

      if (!languageId) {
        throw new ApiError(401, `Language ${language} is not supported`);
      }

      const submissions = testCases.map(({ input, output }) => ({
        source_code: solutionCode,
        language_id: languageId,
        stdin: input,
        expected_out: output,
      }));

      const sumbissionResults = await submitBatch(submissions);

      const tokens = sumbissionResults.map((res) => res.token);

      const results = await pollBatchResults(tokens);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];

        console.log("Result------->", result);

        if (result.status.id !== 3) {
          throw new ApiError(
            401,
            `Testcase ${i + 1} failed for language ${language}`
          );
        }
      }

      const newProblem = await db.problem.create({
        data: {
          title,
          description,
          difficulty,
          tags,
          examples,
          constraints,
          hints,
          editorial,
          testCases,
          codeSnippets,
          referenceSolutions,
          userId: req.user.id,
        },
      });

      return res
        .status(200)
        .json(
          new ApiResponse(200, { newProblem }, "Problem Created Successfully")
        );
    }
  } catch (error) {
    throw new ApiError(401, error?.message || "Error while creating a problem");
  }
});

export const getAllProblems = asyncHandler(async (req, res) => {});

export const getProblemById = asyncHandler(async (req, res) => {});

export const updateProblemById = asyncHandler(async (req, res) => {});

export const deleteProblemById = asyncHandler(async (req, res) => {});

export const getAllProblemsSolvedByUser = asyncHandler(async (req, res) => {});
