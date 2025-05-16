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

export const addProblemToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { problemIds } = req.body;

  try {
    if (!Array.isArray(problemIds) || problemIds.length === 0) {
      throw new ApiError(401, "Invalid Problem id");
    }

    const problemsInPlaylist = await db.problemsInPlaylist.createMany({
      data: problemIds.map((probId) => {
        playlistId, probId;
      }),
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { problemsInPlaylist },
          "Problem Added Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Error while adding a problem into playlist"
    );
  }
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  try {
    const problem = await db.playlist.delete({
      where: {
        id: playlistId,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Playlist Deleted Successfully"));
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Error while deleting the playlist"
    );
  }
});

export const deleteProblemFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { problemIds } = req.body;

  try {
    if (!Array.isArray(problemIds) || problemIds.length === 0) {
      throw new ApiError(401, "Invalid Problem id");
    }

    const deletedProblem = await db.problemsInPlaylist({
      where: {
        playlistId,
        problemId: {
          in: problemIds,
        },
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Problem removed from Playlist Successfully")
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Error while deleting the playlist"
    );
  }
});
