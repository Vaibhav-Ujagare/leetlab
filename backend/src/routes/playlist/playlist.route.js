import { Router } from "express";
import { isLoggedIn } from "../../middleware/auth.middleware.js";
import {
  addProblemToPlaylist,
  creatPlaylist,
  deletePlaylist,
  deleteProblemFromPlaylist,
  getAllPlaylistDetails,
  getPlaylistDetails,
} from "./playlist.controller.js";
const playlistRoute = Router();

playlistRoute.get("/", isLoggedIn, getAllPlaylistDetails);
playlistRoute.get("/:playlistId", isLoggedIn, getPlaylistDetails);
playlistRoute.post("/create-playlist", isLoggedIn, creatPlaylist);
playlistRoute.post(
  "/:playlistId/add-problem",
  isLoggedIn,
  addProblemToPlaylist
);
playlistRoute.delete("/:playlistId", isLoggedIn, deletePlaylist);
playlistRoute.delete(
  "/:playlistId/remove-problem",
  isLoggedIn,
  deleteProblemFromPlaylist
);

export default playlistRoute;
