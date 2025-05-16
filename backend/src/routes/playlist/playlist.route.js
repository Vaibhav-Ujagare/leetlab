import { Router } from "express";
import { isLoggedIn } from "../../middleware/auth.middleware.js";
import {
  addProblemToPlaylist,
  creatPlaylist,
  deletePlaylist,
  getAllPlaylistDetails,
  getPlaylistDetails,
} from "./playlist.controller.js";
const playlistRoute = Router();

playlistRoute.get("/", isLoggedIn, getAllPlaylistDetails);
playlistRoute.get("playlist/:playlistId", isLoggedIn, getPlaylistDetails);
playlistRoute.post("/create-playlist", isLoggedIn, creatPlaylist);
playlistRoute.post("/:playlistId", isLoggedIn, deletePlaylist);
playlistRoute.post(
  "/:playlistId/add-problem",
  isLoggedIn,
  addProblemToPlaylist
);

export default playlistRoute;
