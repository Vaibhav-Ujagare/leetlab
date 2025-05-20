import { db } from "../../libs/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const getAllSubmission = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const submission = await db.submission.findMany({
      where: {
        userId,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { submission }, "Submission Fetched Successfully")
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Problem while fetching the submissions"
    );
  }
});
export const getSubmissionForProblem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const problemId = req.params.problemId;
  try {
    const submissions = await db.submission.findMany({
      where: {
        userId,
        problemId,
      },
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, { submissions }, "Submission Fetched Successfully")
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Problem while fetching the submissions"
    );
  }
});
export const getAllSubmissionForProblem = asyncHandler(async (req, res) => {
  const problemId = req.params.problemId;
  try {
    const submission = await db.submission.findMany({
      where: {
        problemId,
      },
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { count: submission.length },
          "Submission Fetched Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Problem while fetching the submissions"
    );
  }
});
