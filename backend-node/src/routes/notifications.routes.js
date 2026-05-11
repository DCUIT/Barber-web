import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notifications.controller.js";

export const notificationsRouter = express.Router();

notificationsRouter.get("/", requireAuth, getNotifications);

notificationsRouter.patch("/:id/read", requireAuth, markAsRead);

notificationsRouter.patch("/read-all", requireAuth, markAllAsRead);

