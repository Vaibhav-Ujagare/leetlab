import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import {
  sendMail,
  emailVerificationMailGenContent,
  resendEmailVerificationMailGenContent,
  resetPasswordVerificationMailGenContent,
} from "../../utils/mail.js";
import { db } from "../../libs/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserRole } from "../../generated/prisma/index.js";
import jwt from "jsonwebtoken";

const generateTemporaryToken = async function () {
  const unHashedToken = crypto.randomBytes(20).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

  const tokenExpiry = new Date(Date.now() + 20 * 60 * 1000);
  return { hashedToken, tokenExpiry };
};

export const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

    await db.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new ApiError(400, "User already exist");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      username,
      role: UserRole.USER,
      emailVerificationExpiry: new Date(Date.now() + 20 * 60 * 1000),
    },
  });

  if (!newUser) {
    throw new ApiError(401, "User not registered");
  }

  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  newUser.emailVerificationToken = emailVerificationToken;

  await db.user.update({
    where: {
      id: newUser.id,
    },
    data: {
      emailVerificationToken: emailVerificationToken,
    },
  });

  sendMail({
    email: email,
    subject: "Verify your email",
    mailGenContent: emailVerificationMailGenContent(
      username,
      `${process.env.BASE_URL}/api/v1/auth/verify/${emailVerificationToken}`
    ),
  });

  return res
    .status(201)
    .json(new ApiResponse(200, newUser, "User Created Successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid Username of Password");
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new ApiError(401, "Invalid Username of Password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user.id
  );

  await db.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  console.log(accessToken, refreshToken);

  const loggedInUser = await db.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      username: true,
      email: true,
      id: true,
    },
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only true in production
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
        accessToken,
        refreshToken,
      },
      "User Logged In Successfully"
    )
  );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await db.user.update({
    where: { id: req.user.id }, // assuming req.user.id is the correct field
    data: {
      refreshToken: null,
    },
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/", // ensure it applies site-wide
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User Logged Out!"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshAccessToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await db.user.findUnique({
      where: {
        id: decodedRefreshToken.id,
      },
    });

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token Is Expired Or Used");
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/", // ensure it applies site-wide
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user.id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(401, "Invalid Token");
  }

  const user = await db.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiry: {
        gt: new Date(), // token not expired
      },
    },
  });

  if (!user) {
    throw new ApiError(401, "Verification Token Expired");
  }

  await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(200, user, "User Verified Successfully"));
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  // const user = await User.findOne({ email });

  const emailVerificationToken = crypto.randomBytes(32).toString("hex");

  const user = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(401, "User not registered");
  }

  await db.user.update({
    where: {
      email,
    },
    data: {
      emailVerificationToken: emailVerificationToken,
      emailVerificationExpiry: new Date(Date.now() + 20 * 60 * 1000),
    },
  });

  sendMail({
    email: email,
    subject: "Verify your email",
    mailGenContent: resendEmailVerificationMailGenContent(
      user.username,
      `${process.env.BASE_URL}/api/v1/auth/verify/${emailVerificationToken}`
    ),
  });

  return res
    .status(201)
    .json(new ApiResponse(200, user, "Resend Email Successfully"));
});

export const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const { hashedToken, tokenExpiry } = await generateTemporaryToken();

  // user.forgotPasswordToken = hashedToken;
  // user.forgotPasswordTokenExpiry = tokenExpiry;

  await db.user.update({
    where: {
      email,
    },
    data: {
      forgotPasswordToken: hashedToken,
      forgotPasswordTokenExpiry: tokenExpiry,
    },
  });

  sendMail({
    email: email,
    subject: "Reset Password",
    mailGenContent: resetPasswordVerificationMailGenContent(
      user.username,
      `${process.env.BASE_URL}/api/v1/auth/reset-password/${hashedToken}`
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user }, "Reset Password link send on given email ")
    );
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const { hashedToken } = req.params;
  const { password, confPassword } = req.body;

  console.log(password, confPassword);
  const user = await db.user.findFirst({
    where: {
      forgotPasswordToken: hashedToken,
      forgotPasswordTokenExpiry: {
        gt: new Date(), // token not expired
      },
    },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or has expired");
  }

  if (password !== confPassword) {
    throw new ApiError(400, "Password mismatch");
  }

  await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: confPassword,
      forgotPasswordToken: null,
      forgotPasswordTokenExpiry: null,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Password reset Successfully"));
});
