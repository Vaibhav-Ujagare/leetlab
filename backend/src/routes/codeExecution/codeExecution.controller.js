import { db } from "../../libs/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  getLanguageName,
  pollBatchResults,
  submitBatch,
} from "../../libs/judge0.lib.js";

export const executeCode = asyncHandler(async (req, res) => {
  const { source_code, language_id, stdin, expected_outputs, problemId } =
    req.body;
  const userId = req.user.id;

  try {
    if (
      !Array.isArray(stdin) ||
      stdin.length === 0 ||
      !Array.isArray(expected_outputs) ||
      expected_outputs.length !== stdin.length
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
    const results = await pollBatchResults(tokens);

    let allPassed = true;
    const detailedResult = results.map((result, i) => {
      const stdout = result.stdout?.trim();
      const expectedOutput = expected_outputs[i]?.trim();
      const passed = stdout === expectedOutput;

      if (!passed) allPassed = false;

      return {
        testCase: i + 1,
        passed,
        stdout,
        expected: expectedOutput,
        stderr: result.stderr || null,
        compileOutput: result.compile_output || null,
        status: result.status.description,
        memory: result.memory ? `${result.memory} KB` : undefined,
        time: result.time ? `${result.time} S` : undefined,
      };
    });

    const submission = await db.submission.create({
      data: {
        userId,
        problemId,
        sourceCode: source_code,
        language: getLanguageName(language_id),
        stdin: stdin.join("\n"),
        stdout: JSON.stringify(detailedResult.map((result) => result.stdout)),
        stderr: detailedResult.some((result) => result.stderr)
          ? JSON.stringify(detailedResult.some((result) => result.stderr))
          : null,
        compileOutput: detailedResult.some((result) => result.compile_output)
          ? JSON.stringify(
              detailedResult.some((result) => result.compile_output)
            )
          : null,
        status: allPassed ? "ACCEPTED" : "WRONG ANSWER",
        memory: detailedResult.some((result) => result.memory)
          ? JSON.stringify(detailedResult.some((result) => result.memory))
          : null,
        time: detailedResult.some((result) => result.time)
          ? JSON.stringify(detailedResult.some((result) => result.time))
          : null,
      },
    });

    if (allPassed) {
      await db.ProblemSolved.upsert({
        where: {
          userId_problemId: {
            userId,
            problemId,
          },
        },
        update: {},
        create: {
          userId,
          problemId,
        },
      });
    }

    const testCaseResults = detailedResult.map((result) => ({
      submissionId: submission.id,
      testCase: result.testCase,
      passed: result.passed,
      stdout: result.stdout,
      expected: result.expected,
      stderr: result.stderr,
      compileOutput: result.compile_output,
      status: result.status,
      memory: result.memory,
      time: result.time,
    }));

    await db.TestCaseResult.createMany({
      data: testCaseResults,
    });

    const submissionWithTestCase = await db.submission.findUnique({
      where: {
        id: submission.id,
      },
      include: {
        testCases: true,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { submissionWithTestCase }, "Code executed"));
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "You are not allowed to create a problem"
    );
  }
});
