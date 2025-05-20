import { db } from "../../libs/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
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
      console.log(submissions);

      const submissionResults = await submitBatch(submissions);
      console.log("----------------------", submissionResults);

      const tokens = submissionResults.map((res) => res.token);

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

export const getAllProblems = asyncHandler(async (req, res) => {
  try {
    const problems = await db.problem.findMany();

    if (!problems) {
      throw new ApiError(401, "No problem found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { problems }, "Problem Feteched Successfully")
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Error while fetching a problem");
  }
});

export const getProblemById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    if (!id) {
      throw new ApiError(401, "Invalid problem ID");
    }

    const problem = await db.problem.findUnique({
      where: {
        id,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { problem }, "Problem Feteched Successfully"));
  } catch (error) {
    throw new ApiError(401, error?.message || "Error while fetching a problem");
  }
});

export const updateProblemById = asyncHandler(async (req, res) => {
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

  const { id } = req.params;
  const problem = await db.problem.findUnique({
    where: {
      id,
    },
  });

  if (!problem) {
    throw new ApiError(401, "Invalid Problem ID");
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
      console.log(submissions);

      const submissionResults = await submitBatch(submissions);

      const tokens = submissionResults.map((res) => res.token);

      const results = await pollBatchResults(tokens);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];

        if (result.status.id !== 3) {
          throw new ApiError(
            401,
            `Testcase ${i + 1} failed for language ${language}`
          );
        }
      }

      const updateProblem = await db.problem.update({
        where: {
          id,
        },
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
          new ApiResponse(
            200,
            { updateProblem },
            "Problem Updated Successfully"
          )
        );
    }
  } catch (error) {
    throw new ApiError(401, error?.message || "Error while updating a problem");
  }
});

export const deleteProblemById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const problem = await db.problem.findUnique({
    where: {
      id,
    },
  });

  if (!problem) {
    throw new ApiError(401, "problem not exist");
  }

  await db.problem.delete({
    where: { id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Problem Deleted Successfully"));
});

export const getAllProblemsSolvedByUser = asyncHandler(async (req, res) => {
  try {
    const problems = await db.problem.findMany({
      where: {
        solvedBy: {
          some: {
            userId: req.user.id,
          },
        },
      },
      include: {
        solvedBy: {
          where: {
            userId: req.user.id,
          },
        },
      },
    });

    if (!problems) {
      throw new ApiError(401, "Error while fetching problems");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { problems }, "Problem Fetched Successfully"));
  } catch (error) {
    throw new ApiError(401, error?.message || "problem not exist");
  }
});
