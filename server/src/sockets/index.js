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
const pendingCallTimeouts = new Map();

const clearPendingCallTimeout = (callId) => {
  const timeoutId = pendingCallTimeouts.get(`${callId}`);
  if (timeoutId) {
    clearTimeout(timeoutId);
    pendingCallTimeouts.delete(`${callId}`);
  }
};

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
    matchmakingService.clearDisconnectTimer(userId);
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
    const restoredSession = matchmakingService.getActiveSessionForUser(userId);
    if (restoredSession) {
      const session = await ChatSession.findById(restoredSession.sessionId);
      const partnerUser = await User.findById(restoredSession.partnerId).select(
        "randomUsername anonymousAvatar interests gender avatarUrl"
      );
      if (session && partnerUser) {
        socket.emit("session_restored", buildSessionPayload(session, userId, partnerUser));
      }
    }

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

    const emitUnavailable = (receiverId, message) => {
      io.to(`user:${userId}`).emit("call_unavailable", {
        receiverId,
        message,
      });
    };

    const handleCallUser = async ({ receiverId, type = "video", offer } = {}) => {
      const receiver = `${receiverId || ""}`.trim();
      const callType = type === "voice" ? "voice" : "video";

      if (!receiver || receiver === userId || !offer) {
        emitUnavailable(receiver, "Unable to start call with this user.");
        return;
      }

      const receiverUser = await User.findById(receiver).select("isBanned blockedUserIds");
      if (!receiverUser || receiverUser.isBanned) {
        emitUnavailable(receiver, "User not found.");
        return;
      }

      const receiverBlockedCaller = (receiverUser.blockedUserIds || []).some(
        (blockedUserId) => `${blockedUserId}` === userId
      );
      const callerBlockedReceiver = (socket.user.blockedUserIds || []).some(
        (blockedUserId) => `${blockedUserId}` === receiver
      );
      if (receiverBlockedCaller || callerBlockedReceiver) {
        emitUnavailable(receiver, "You cannot call this user.");
        return;
      }

      if (!activeConnections.has(receiver)) {
        emitUnavailable(receiver, "This user is offline or unavailable right now.");
        return;
      }

      await User.findByIdAndUpdate(userId, { lastActiveAt: new Date(), lastSeen: new Date() });
      const call = await Call.create({
        callerId: userId,
        receiverId: receiver,
        type: callType,
        status: "ringing",
      });

      io.to(`user:${userId}`).emit("call_outgoing", {
        callId: call._id,
        receiverId: receiver,
        type: callType,
      });

      io.to(`user:${receiver}`).emit("incoming_call", {
        callId: call._id,
        caller: {
          _id: userId,
          randomUsername: socket.user.randomUsername,
          avatarUrl: socket.user.avatarUrl,
          anonymousAvatar: socket.user.anonymousAvatar,
        },
        type: callType,
        offer,
      });

      const timeoutId = setTimeout(async () => {
        const freshCall = await Call.findById(call._id);
        if (!freshCall || freshCall.status !== "ringing") return;
        await Call.findByIdAndUpdate(call._id, { status: "missed", endedAt: new Date() });
        io.to(`user:${userId}`).emit("call_timeout", {
          callId: call._id,
          message: "The other user did not answer.",
        });
        io.to(`user:${receiver}`).emit("call_timeout", {
          callId: call._id,
          message: "Missed call.",
        });
        pendingCallTimeouts.delete(`${call._id}`);
      }, 30000);

      pendingCallTimeouts.set(`${call._id}`, timeoutId);
    };

    const handleAcceptCall = async ({ callId, callerId, answer } = {}) => {
      if (!callId || !callerId || !answer) return;
      clearPendingCallTimeout(callId);
      await Call.findByIdAndUpdate(callId, { status: "accepted", startedAt: new Date() });
      io.to(`user:${callerId}`).emit("accept_call", { callId, answer });
    };

    const handleRejectCall = async ({ callId, callerId } = {}) => {
      if (!callId || !callerId) return;
      clearPendingCallTimeout(callId);
      await Call.findByIdAndUpdate(callId, { status: "rejected", endedAt: new Date() });
      io.to(`user:${callerId}`).emit("reject_call", { callId });
    };

    socket.on("call_user", handleCallUser);
    socket.on("call-user", handleCallUser);
    socket.on("accept_call", handleAcceptCall);
    socket.on("accept-call", handleAcceptCall);
    socket.on("reject_call", handleRejectCall);
    socket.on("reject-call", handleRejectCall);

    socket.on("offer", ({ receiverId, offer }) => {
      io.to(`user:${receiverId}`).emit("offer", { senderId: userId, offer });
    });

    socket.on("answer", ({ receiverId, answer }) => {
      io.to(`user:${receiverId}`).emit("answer", { senderId: userId, answer });
    });

    const forwardIceCandidate = ({ receiverId, candidate } = {}) => {
      if (!receiverId || !candidate) return;
      io.to(`user:${receiverId}`).emit("webrtc_ice_candidate", { senderId: userId, candidate });
    };

    socket.on("webrtc_ice_candidate", forwardIceCandidate);
    socket.on("ice_candidate", forwardIceCandidate);
    socket.on("ice-candidate", forwardIceCandidate);

    socket.on("call_reconnect_offer", ({ receiverId, offer, reason, attempt } = {}) => {
      if (!receiverId || !offer) return;
      io.to(`user:${receiverId}`).emit("call_reconnect_offer", {
        senderId: userId,
        offer,
        reason,
        attempt,
      });
    });
    socket.on("call-reconnect-offer", ({ receiverId, offer, reason, attempt } = {}) => {
      if (!receiverId || !offer) return;
      io.to(`user:${receiverId}`).emit("call_reconnect_offer", {
        senderId: userId,
        offer,
        reason,
        attempt,
      });
    });

    socket.on("call_reconnect_answer", ({ receiverId, answer } = {}) => {
      if (!receiverId || !answer) return;
      io.to(`user:${receiverId}`).emit("call_reconnect_answer", {
        senderId: userId,
        answer,
      });
    });
    socket.on("call-reconnect-answer", ({ receiverId, answer } = {}) => {
      if (!receiverId || !answer) return;
      io.to(`user:${receiverId}`).emit("call_reconnect_answer", {
        senderId: userId,
        answer,
      });
    });

    const handleEndCall = async ({ callId, receiverId } = {}) => {
      if (!receiverId) return;
      clearPendingCallTimeout(callId);
      if (callId) {
        await Call.findByIdAndUpdate(callId, { status: "ended", endedAt: new Date() });
      }
      io.to(`user:${receiverId}`).emit("end_call", { callId });
    };

    socket.on("end_call", handleEndCall);
    socket.on("end-call", handleEndCall);

    socket.on("disconnect", async () => {
      matchmakingService.removeFromQueue(userId);
      const remainingConnections = bumpConnection(userId, -1);
      if (remainingConnections === 0) {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
          lastActiveAt: new Date(),
        });
        io.emit("presence:update", { userId, isOnline: false, lastSeen: new Date() });
        if (matchmakingService.getActiveSessionForUser(userId)) {
          matchmakingService.scheduleDisconnect(userId, async () => {
            await endSession({
              matchmakingService,
              userId,
              endedBy: socket.user._id,
              reason: "disconnect",
              io,
            });
          });
        }
      }

      io.emit("queue_status", { status: "updated", queueSize: matchmakingService.getQueueSize() });
    });
  });

  return io;
};
