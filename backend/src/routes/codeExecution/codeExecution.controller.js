import { db } from "../../libs/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { pollBatchResults, submitBatch } from "../../libs/judge0.lib.js";

export const executeCode = asyncHandler(async (req, res) => {
  const { source_code, language_id, stdin, expected_output, problemId } =
    req.body;
  const userId = req.user.id;

  try {
    if (
      !Array.isArray(stdin) ||
      stdin.length === 0 ||
      !Array.isArray(expected_output) ||
      expected_output.length !== stdin.length
    ) {
      throw new ApiError(401, "Invalid or missing test cases");
    }

    const submissions = stdin.map((input) => ({
      source_code,
      language_id,
      stdin: input,
    }));

    const submitResponse = await submitBatch(submissions);
    const tokens = await submitResponse.map((res) => res.token);
    console.log(tokens);
    const results = await pollBatchResults(tokens);

    console.log("---------------", results);

    return res
      .status(200)
      .json(new ApiResponse(200, { results }, "Code executed"));
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "You are not allowed to create a problem"
    );
  }
});
