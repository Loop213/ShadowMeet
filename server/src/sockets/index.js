import { Server } from "socket.io";
import { User } from "../models/User.js";
import { Message } from "../models/Message.js";
import { Call } from "../models/Call.js";
import { ChatSession } from "../models/ChatSession.js";
import { Report } from "../models/Report.js";
import { verifyToken } from "../utils/token.js";
import { moderateContent } from "../services/moderationService.js";

const GLOBAL_ROOM = "global:room";
const activeConnections = new Map();

const bumpConnection = (userId, delta) => {
  const nextValue = Math.max(0, (activeConnections.get(userId) || 0) + delta);
  if (nextValue === 0) {
    activeConnections.delete(userId);
  } else {
    activeConnections.set(userId, nextValue);
  }
  return nextValue;
};

const buildSessionPayload = (session, meId, partnerUser) => ({
  sessionId: session._id,
  partner: {
    _id: partnerUser._id,
    randomUsername: partnerUser.randomUsername,
    anonymousAvatar: partnerUser.anonymousAvatar || partnerUser.avatarUrl,
    interests: partnerUser.interests || [],
    gender: partnerUser.gender || "",
  },
  mode: session.mode,
  matchedInterests: session.matchedInterests,
  startedAt: session.startTime,
  meId,
});

const getPartnerId = (matchmakingService, userId) =>
  matchmakingService.getActiveSessionForUser(userId)?.partnerId || null;

const endSession = async ({
  matchmakingService,
  userId,
  endedBy,
  reason = "disconnect",
  notify = true,
  io,
}) => {
  const active = matchmakingService.clearSession(userId);
  if (!active) return null;

  await ChatSession.findByIdAndUpdate(active.sessionId, {
    status:
      reason === "skip" ? "skipped" : reason === "report" ? "reported" : "disconnected",
    endTime: new Date(),
    endedBy,
    endedReason: reason,
  });

  await Message.deleteMany({
    sessionId: active.sessionId,
    "moderation.flagged": false,
  });

  if (notify) {
    io.to(`user:${active.partnerId}`).emit("disconnect_partner", {
      sessionId: active.sessionId,
      reason,
    });
  }

  return active;
};

export const initializeSocket = (httpServer, services = {}) => {
  const { adapter: redisAdapter, matchmakingService } = services;

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  if (redisAdapter) {
    io.adapter(redisAdapter);
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select(
        "randomUsername role isBanned avatarUrl anonymousAvatar interests blockedUserIds gender"
      );
      if (!user || user.isBanned) {
        return next(new Error("Unauthorized"));
      }
      socket.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = `${socket.user._id}`;
    matchmakingService.setBlockedUsers(userId, socket.user.blockedUserIds || []);
    bumpConnection(userId, 1);
    socket.join(GLOBAL_ROOM);
    socket.join(`user:${userId}`);

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
      lastActiveAt: new Date(),
    });

    io.emit("presence:update", { userId, isOnline: true, lastSeen: new Date() });
    io.emit("queue_status", { status: "updated", queueSize: matchmakingService.getQueueSize() });

    socket.emit("session_ready", { userId, randomUsername: socket.user.randomUsername });

    socket.on("find_partner", async ({ interests = [], mode = "text", genderFilter = "any" } = {}) => {
      const existing = matchmakingService.getActiveSessionForUser(userId);
      if (existing) return;

      const match = matchmakingService.findPartner({
        userId,
        interests,
        mode,
        gender: socket.user.gender,
        genderFilter,
      });

      if (!match) {
        socket.emit("queue_status", {
          status: "searching",
          queueSize: matchmakingService.getQueueSize(),
        });
        return;
      }

      const session = await ChatSession.create({
        user1: match.userA,
        user2: match.userB,
        mode: match.mode,
        matchedInterests: match.matchedInterests,
      });

      matchmakingService.registerSession(session._id, match.userA, match.userB);

      const [userA, userB] = await Promise.all([
        User.findById(match.userA).select("randomUsername anonymousAvatar interests gender"),
        User.findById(match.userB).select("randomUsername anonymousAvatar interests gender"),
      ]);

      io.to(`user:${match.userA}`).emit("match_found", buildSessionPayload(session, match.userA, userB));
      io.to(`user:${match.userB}`).emit("match_found", buildSessionPayload(session, match.userB, userA));
      io.emit("queue_status", { status: "updated", queueSize: matchmakingService.getQueueSize() });
    });

    socket.on("skip_partner", async () => {
      await endSession({
        matchmakingService,
        userId,
        endedBy: socket.user._id,
        reason: "skip",
        io,
      });
    });

    socket.on("disconnect_partner", async () => {
      await endSession({
        matchmakingService,
        userId,
        endedBy: socket.user._id,
        reason: "disconnect",
        io,
      });
    });

    socket.on("typing", ({ receiverId = null, chatScope = "global", isTyping }) => {
      if (chatScope === "session") {
        const partnerId = getPartnerId(matchmakingService, userId);
        if (partnerId) {
          io.to(`user:${partnerId}`).emit("typing", {
            senderId: userId,
            receiverId: partnerId,
            chatScope,
            isTyping,
          });
        }
        return;
      }

      const payload = { senderId: userId, receiverId, chatScope, isTyping };

      if (chatScope === "private" && receiverId) {
        io.to(`user:${receiverId}`).emit("typing", payload);
      } else {
        socket.to(GLOBAL_ROOM).emit("typing", payload);
      }
    });

    socket.on("send_message", async (payload) => {
      const {
        receiverId = null,
        chatScope = "global",
        messageType = "text",
        content,
        sessionId = null,
      } = payload;
      if (!content) return;

      const actualReceiverId =
        chatScope === "session" ? getPartnerId(matchmakingService, userId) : receiverId;
      const moderation = moderateContent(content);

      await User.findByIdAndUpdate(userId, { lastActiveAt: new Date(), lastSeen: new Date() });
      const message = await Message.create({
        senderId: userId,
        receiverId: actualReceiverId,
        chatScope,
        sessionId,
        messageType,
        content,
        moderation,
        deliveredTo: [socket.user._id],
        seenBy: [socket.user._id],
      });

      const populated = await message.populate(
        "senderId",
        "randomUsername avatarUrl anonymousAvatar isOnline"
      );

      if (chatScope === "session" && actualReceiverId) {
        await Message.findByIdAndUpdate(message._id, { $addToSet: { deliveredTo: actualReceiverId } });
        io.to(`user:${actualReceiverId}`).emit("session_message", populated);
        io.to(`user:${userId}`).emit("session_message", populated);
        io.to(`user:${actualReceiverId}`).emit("message_status", {
          messageId: message._id,
          status: "delivered",
        });
      } else if (chatScope === "private" && actualReceiverId) {
        await Message.findByIdAndUpdate(message._id, { $addToSet: { deliveredTo: actualReceiverId } });
        io.to(`user:${actualReceiverId}`).emit("receive_message", populated);
        io.to(`user:${userId}`).emit("receive_message", populated);
        io.to(`user:${actualReceiverId}`).emit("message_status", {
          messageId: message._id,
          status: "delivered",
        });
      } else {
        io.to(GLOBAL_ROOM).emit("receive_message", populated);
      }
    });

    socket.on("message_seen", async ({ messageId, peerId }) => {
      const message = await Message.findById(messageId);
      if (!message) return;

      if (!message.seenBy.some((seenUserId) => `${seenUserId}` === userId)) {
        message.seenBy.push(socket.user._id);
      }
      await message.save();

      if (peerId) {
        io.to(`user:${peerId}`).emit("message_status", {
          messageId,
          status: "seen",
          seenBy: userId,
        });
      }
    });

    socket.on("report_user", async ({ reportedUserId, sessionId, reason = "other", notes = "" }) => {
      await Report.create({
        reporterId: socket.user._id,
        reportedUserId,
        sessionId,
        reason,
        notes,
      });

      await endSession({
        matchmakingService,
        userId,
        endedBy: socket.user._id,
        reason: "report",
        io,
      });
    });

    socket.on("block_user", async ({ blockedUserId }) => {
      await User.findByIdAndUpdate(socket.user._id, {
        $addToSet: { blockedUserIds: blockedUserId },
      });
      socket.user.blockedUserIds = [...(socket.user.blockedUserIds || []), blockedUserId];
      matchmakingService.setBlockedUsers(userId, socket.user.blockedUserIds);

      await endSession({
        matchmakingService,
        userId,
        endedBy: socket.user._id,
        reason: "disconnect",
        io,
      });
    });

    socket.on("call_user", async ({ receiverId, type, offer }) => {
      await User.findByIdAndUpdate(userId, { lastActiveAt: new Date(), lastSeen: new Date() });
      const call = await Call.create({
        callerId: userId,
        receiverId,
        type,
        status: "ringing",
      });

      io.to(`user:${receiverId}`).emit("incoming_call", {
        callId: call._id,
        caller: {
          _id: userId,
          randomUsername: socket.user.randomUsername,
          avatarUrl: socket.user.avatarUrl,
          anonymousAvatar: socket.user.anonymousAvatar,
        },
        type,
        offer,
      });
    });

    socket.on("accept_call", async ({ callId, callerId, answer }) => {
      await Call.findByIdAndUpdate(callId, { status: "accepted", startedAt: new Date() });
      io.to(`user:${callerId}`).emit("accept_call", { callId, answer });
    });

    socket.on("reject_call", async ({ callId, callerId }) => {
      await Call.findByIdAndUpdate(callId, { status: "rejected", endedAt: new Date() });
      io.to(`user:${callerId}`).emit("reject_call", { callId });
    });

    socket.on("offer", ({ receiverId, offer }) => {
      io.to(`user:${receiverId}`).emit("offer", { senderId: userId, offer });
    });

    socket.on("answer", ({ receiverId, answer }) => {
      io.to(`user:${receiverId}`).emit("answer", { senderId: userId, answer });
    });

    socket.on("webrtc_ice_candidate", ({ receiverId, candidate }) => {
      io.to(`user:${receiverId}`).emit("webrtc_ice_candidate", { senderId: userId, candidate });
    });

    socket.on("ice_candidate", ({ receiverId, candidate }) => {
      io.to(`user:${receiverId}`).emit("ice_candidate", { senderId: userId, candidate });
    });

    socket.on("end_call", async ({ callId, receiverId }) => {
      await Call.findByIdAndUpdate(callId, { status: "ended", endedAt: new Date() });
      io.to(`user:${receiverId}`).emit("end_call", { callId });
    });

    socket.on("disconnect", async () => {
      matchmakingService.removeFromQueue(userId);
      await endSession({
        matchmakingService,
        userId,
        endedBy: socket.user._id,
        reason: "disconnect",
        io,
      });

      const remainingConnections = bumpConnection(userId, -1);
      if (remainingConnections === 0) {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
          lastActiveAt: new Date(),
        });
        io.emit("presence:update", { userId, isOnline: false, lastSeen: new Date() });
      }

      io.emit("queue_status", { status: "updated", queueSize: matchmakingService.getQueueSize() });
    });
  });

  return io;
};
