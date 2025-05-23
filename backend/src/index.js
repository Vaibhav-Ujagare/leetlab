import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth/auth.route.js";
import problemRoutes from "./routes/problems/problem.route.js";
import codeExecutionRoute from "./routes/codeExecution/codeExecution.route.js";
import playlistRoute from "./routes/playlist/playlist.route.js";
import submissionRoute from "./routes/submission/submission.route.js";

dotenv.config();

const port = process.env.PORT || 4000;

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/problems", problemRoutes);

app.use("/api/v1/execute-code", codeExecutionRoute);

app.use("/api/v1/playlists", playlistRoute);

app.use("/api/v1/submission", submissionRoute);

app.listen(port, () => {
  console.log(`Server is running ${port}`);
});
