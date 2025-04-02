import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
} from "../controllers/messageController.js";
const router = express.Router();

router.get("/conversations", verifyToken, getConversations);
router.get("/:otherUserId", verifyToken, getMessages);
router.post("/", verifyToken, sendMessage);
router.delete("/:messageId", verifyToken, deleteMessage);

export default router;
