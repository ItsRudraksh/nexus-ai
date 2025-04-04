import { Server } from "socket.io";
import http, { METHODS } from "http";
import express from "express";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

export const app = express();
app.use(cors({ credentials: true, origin: `${process.env.CLIENT_URL}` }));
export const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: `${process.env.CLIENT_URL}`,
    methods: ["GET", "POST"],
  },
});

export const getRecipientSocketId = (recipientId) => {
  return userSocketMap[recipientId];
};

const userSocketMap = {}; // userId: socketId

io.on("connection", (socket) => {
  console.log("user connected", socket.id);
  const userId = socket.handshake.query.userId;

  if (userId != "undefined") userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
    try {
      await Message.updateMany(
        { conversationId: conversationId, seen: false },
        { $set: { seen: true } }
      );
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { "lastMessage.seen": true } }
      );
      io.to(userSocketMap[userId]).emit("messagesSeen", { conversationId });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("messageDeleted", ({ messageId, recipientId }) => {
    try {
      const recipientSocketId = userSocketMap[recipientId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("messageDeleted", messageId);
      }
    } catch (error) {
      console.log("Error in messageDeleted socket event:", error);
    }
  });

  socket.on("chatCleared", ({ conversationId, recipientId }) => {
    try {
      const recipientSocketId = userSocketMap[recipientId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("chatCleared", { conversationId });
      }
    } catch (error) {
      console.log("Error in chatCleared socket event:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});
