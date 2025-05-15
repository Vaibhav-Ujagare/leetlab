import axios from "axios";
import { ApiError } from "../utils/apiError.js";

export const getJudge0LanguageId = (language) => {
  const languageMap = {
    PYTHON: 71,
    JAVA: 62,
    JAVASCRIPT: 63,
  };
  return languageMap[language.toUpperCase()];
};

export const submitBatch = async (submissions) => {
  try {
    const { data } = await axios.post(
      `${process.env.JUDGE0_API_URL}/submissions/batch?base64_encoded=false`,
      { submissions }
    );
    console.log(data);
    return data;
  } catch (error) {
    throw new ApiError(401, error?.message || "Error in submitBatch Function");
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const pollBatchResults = async (tokens) => {
  console.log("reached in pollBatchResults");
  while (true) {
    const { data } = await axios.get(
      `${process.env.JUDGE0_API_URL}/submissions/batch`,
      {
        params: {
          tokens: tokens.join(","),
          base64_encoded: false,
        },
      }
    );

    const results = data.submissions;
    const isAllDone = results.every((result) => result.status.id >= 3);

    console.log(isAllDone);

    if (isAllDone) return results;

    await sleep(1000);
  }
};
