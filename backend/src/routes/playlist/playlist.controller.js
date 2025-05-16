import { db } from "../../libs/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const creatPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(401, "Name of description cannot be empty");
  }

  try {
    const playlist = await db.playlist.create({
      data: {
        name,
        description,
        userId: req.user.id,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { playlist }, "Playlist Created Successfully")
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Error While creating playlist");
  }
});

export const getAllPlaylistDetails = asyncHandler(async (req, res) => {
  try {
    const playlists = await db.playlist.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        problems: {
          include: {
            problem: true,
          },
        },
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { playlists }, "Playlist Fetched Successfully")
      );
  } catch (error) {
    throw new ApiError(401, "Failed to Fetched Playlist");
  }
});

export const getPlaylistDetails = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  try {
    const playlist = await db.problem.findUnique({
      where: {
        id: playlistId,
        userId: req.user.id,
      },
      include: {
        problems: {
          include: {
            problem: true,
          },
        },
      },
    });

    if (!playlist) {
      throw new ApiError(401, "Playlist Not Found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { playlist }, "Playlist Found"));
  } catch (error) {
    throw new ApiError(401, "Failed to Fetched Playlist By ID");
  }
});

export const addProblemToPlaylist = asyncHandler(async (req, res) => {});

export const deletePlaylist = asyncHandler(async (req, res) => {});

export const deleteProblemFromPlaylist = asyncHandler(async (req, res) => {});
