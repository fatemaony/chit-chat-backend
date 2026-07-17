import { getAuth } from "@clerk/express";
import { Router } from "express";
import { getUserFromClerk } from "../modules/users/user.service.js";
import {
  listChatUsers,
  listDirectMessages,
  clearDirectMessages,
} from "../modules/chat/chat.service.js";

export const chatRouter = Router();

chatRouter.get("/users", async (req, res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const profile = await getUserFromClerk(auth.userId);
    const currentUserId = profile.user.id as number;

    const users = await listChatUsers(currentUserId);

    res.json({ data: users });
  } catch (err) {
    next(err);
  }
});

chatRouter.get(
  "/conversations/:otherUserId/messages",
  async (req, res, next) => {
    try {
      const auth = getAuth(req);

      if (!auth.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const profile = await getUserFromClerk(auth.userId);
      const currentUserId = profile.user.id as number;

      const rawOtherUserId = req.params.otherUserId;
      const otherUserId = Number(rawOtherUserId);

      const limitParam = req.query.limit;
      const limit =
        typeof limitParam === "string" ? parseInt(limitParam, 10) : 100;

      const cursorParam = req.query.cursor;
      const cursor =
        typeof cursorParam === "string" ? parseInt(cursorParam, 10) : undefined;

      const messages = await listDirectMessages({
        userId: currentUserId,
        otherUserId,
        limit: limit || 50,
        cursor,
      });

      res.json({ data: messages });
    } catch (err) {
      next(err);
    }
  }
);

chatRouter.delete(
  "/conversations/:otherUserId/messages",
  async (req, res, next) => {
    try {
      const auth = getAuth(req);

      if (!auth.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const profile = await getUserFromClerk(auth.userId);
      const currentUserId = profile.user.id as number;

      const rawOtherUserId = req.params.otherUserId;
      const otherUserId = Number(rawOtherUserId);

      await clearDirectMessages({
        userId: currentUserId,
        otherUserId,
      });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);
