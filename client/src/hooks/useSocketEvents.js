import { useEffect, useRef } from "react";
import { getSocket } from "../services/socket";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { useRandomChatStore } from "../store/useRandomChatStore";
import { useWebRTC } from "./useWebRTC";

export const useSocketEvents = () => {
  const token = useAuthStore((state) => state.token);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const setTypingState = useChatStore((state) => state.setTypingState);
  const updatePresence = useChatStore((state) => state.updatePresence);
  const setMessageStatus = useChatStore((state) => state.setMessageStatus);
  const setQueueState = useRandomChatStore((state) => state.setQueueState);
  const setMatch = useRandomChatStore((state) => state.setMatch);
  const restoreSession = useRandomChatStore((state) => state.restoreSession);
  const appendSessionMessage = useRandomChatStore((state) => state.appendSessionMessage);
  const endRandomSession = useRandomChatStore((state) => state.endSession);
  const setStrangerTyping = useRandomChatStore((state) => state.setStrangerTyping);
  const setOnlineCount = useRandomChatStore((state) => state.setOnlineCount);
  const randomActiveSession = useRandomChatStore((state) => state.activeSession);
  const randomPartner = useRandomChatStore((state) => state.partner);
  const randomMode = useRandomChatStore((state) => state.mode);
  const setIncomingCall = useCallStore((state) => state.setIncomingCall);
  const startCallSession = useCallStore((state) => state.startCallSession);
  const setCallNotice = useCallStore((state) => state.setCallNotice);
  const activeCall = useCallStore((state) => state.activeCall);
  const clearCall = useCallStore((state) => state.clearCall);
  const {
    acceptIncomingCall,
    applyAnswer,
    applyIceCandidate,
    handleReconnectOffer,
    applyReconnectAnswer,
  } = useWebRTC();
  const lastIncomingCallRef = useRef({ callId: null, timestamp: 0 });
  const lastAcceptedAnswerRef = useRef({ key: null, timestamp: 0 });
  const seenCandidateRef = useRef(new Map());

  useEffect(() => {
    if (!token) return undefined;

    const socket = getSocket(token);
    if (!socket) return undefined;

    socket.on("receive_message", appendMessage);
    socket.on("typing", ({ senderId, isTyping, chatScope }) => {
      if (chatScope === "session") {
        setStrangerTyping(isTyping);
        return;
      }
      setTypingState(`${chatScope}:${senderId}`, isTyping);
    });
    socket.on("presence:update", updatePresence);
    socket.on("connect", () => {
      if (randomActiveSession?.sessionId) {
        socket.emit("sync_session", { sessionId: randomActiveSession.sessionId });
      }
    });
    socket.on("queue_status", ({ status, queueSize }) => {
      setQueueState({ queueStatus: status, queueSize });
      setOnlineCount(queueSize || 0);
    });
    const handleMatchFound = (payload) => {
      clearCall();
      setMatch(payload);
    };
    socket.on("match_found", handleMatchFound);
    socket.on("session_restored", restoreSession);
    socket.on("session_invalid", ({ reason } = {}) => {
      clearCall();
      endRandomSession();
      setCallNotice({
        tone: "amber",
        title: "Session expired",
        message:
          reason === "partner_offline"
            ? "Your last match left the room. Please start a new chat."
            : "Previous session is no longer active. Please find a new match.",
      });
    });
    socket.on("session_message", appendSessionMessage);
    const handlePartnerDisconnect = ({ reason } = {}) => {
      clearCall();
      endRandomSession();
      setCallNotice({
        tone: "amber",
        title: "Partner left",
        message:
          reason === "skip"
            ? "Your match skipped. Find a new partner."
            : "Session ended. Start a new chat.",
      });
    };
    socket.on("disconnect_partner", handlePartnerDisconnect);
    socket.on("message_status", ({ messageId, status, seenBy }) => {
      setMessageStatus(messageId, { status, seenBy });
    });

    const normalizeIncomingCall = (payload = {}) => {
      const caller = payload.caller || payload.from || {};
      const callerId = `${caller._id || payload.callerId || payload.senderId || ""}`.trim();
      if (!callerId) return null;

      return {
        ...payload,
        callId: payload.callId || `${callerId}:${payload.type || "video"}`,
        caller: {
          _id: callerId,
          randomUsername: caller.randomUsername || "Stranger",
          avatarUrl: caller.avatarUrl,
          anonymousAvatar: caller.anonymousAvatar,
        },
        type: payload.type === "voice" ? "voice" : "video",
      };
    };

    const handleIncomingCall = async (payload) => {
      const incomingCall = normalizeIncomingCall(payload);
      if (!incomingCall) return;

      const now = Date.now();
      if (
        lastIncomingCallRef.current.callId === incomingCall.callId &&
        now - lastIncomingCallRef.current.timestamp < 1600
      ) {
        return;
      }
      lastIncomingCallRef.current = { callId: incomingCall.callId, timestamp: now };

      if (
        activeCall?.receiverId &&
        activeCall.receiverId !== incomingCall.caller._id &&
        activeCall.status !== "ended"
      ) {
        socket.emit("reject_call", {
          callId: incomingCall.callId,
          callerId: incomingCall.caller._id,
        });
        return;
      }

      if (
        activeCall?.receiverId === incomingCall.caller._id &&
        ["connected", "connecting", "reconnecting"].includes(activeCall.status)
      ) {
        return;
      }

      const isCurrentRandomPartner =
        Boolean(randomActiveSession?.sessionId) && randomPartner?._id === incomingCall.caller._id;
      const shouldAutoAccept =
        isCurrentRandomPartner && (randomMode === "video" || incomingCall.type === "video");

      if (shouldAutoAccept) {
        try {
          await acceptIncomingCall(incomingCall);
          return;
        } catch {
          setCallNotice({
            tone: "rose",
            title: "Could not join video call",
            message: "Camera or microphone permission is blocked on this device.",
          });
          return;
        }
      }

      setIncomingCall(incomingCall);
    };

    const handleAcceptCall = async ({ answer, callId } = {}) => {
      if (!answer) return;
      const key = `${callId || "no-call"}:${answer.type || ""}:${(answer.sdp || "").slice(0, 48)}`;
      const now = Date.now();
      if (
        lastAcceptedAnswerRef.current.key === key &&
        now - lastAcceptedAnswerRef.current.timestamp < 1600
      ) {
        return;
      }
      lastAcceptedAnswerRef.current = { key, timestamp: now };

      try {
        await applyAnswer(answer);
      } catch {
        setCallNotice({
          tone: "amber",
          title: "Call handshake delayed",
          message: "Re-syncing call negotiation. Please wait a moment.",
        });
      }
    };

    const handleIceCandidate = async ({ candidate } = {}) => {
      if (!candidate) return;

      const candidateKey = [
        candidate.candidate,
        candidate.sdpMid,
        candidate.sdpMLineIndex,
        candidate.usernameFragment,
      ]
        .filter(Boolean)
        .join("|");

      if (!candidateKey) {
        await applyIceCandidate(candidate);
        return;
      }

      const now = Date.now();
      const lastSeenAt = seenCandidateRef.current.get(candidateKey);
      if (lastSeenAt && now - lastSeenAt < 5000) return;
      seenCandidateRef.current.set(candidateKey, now);

      if (seenCandidateRef.current.size > 160) {
        const expiry = now - 6000;
        for (const [key, timestamp] of seenCandidateRef.current.entries()) {
          if (timestamp < expiry) seenCandidateRef.current.delete(key);
        }
      }

      await applyIceCandidate(candidate);
    };

    socket.on("incoming_call", handleIncomingCall);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call_outgoing", ({ callId, receiverId, type }) => {
      startCallSession({ callId, receiverId, type, status: "calling", direction: "outgoing" });
    });
    socket.on("call_unavailable", ({ message }) => {
      clearCall();
      setCallNotice({
        tone: "amber",
        title: "User not available",
        message: message || "This user is offline or unavailable right now.",
      });
    });
    socket.on("call_timeout", ({ message }) => {
      clearCall();
      setCallNotice({
        tone: "amber",
        title: "No response",
        message: message || "The call was missed.",
      });
    });
    socket.on("accept_call", handleAcceptCall);
    socket.on("accept-call", handleAcceptCall);
    socket.on("reject_call", () => {
      clearCall();
      setCallNotice({
        tone: "rose",
        title: "Call declined",
        message: "The other user rejected your call.",
      });
    });
    socket.on("reject-call", () => {
      clearCall();
      setCallNotice({
        tone: "rose",
        title: "Call declined",
        message: "The other user rejected your call.",
      });
    });
    socket.on("end_call", clearCall);
    socket.on("webrtc_ice_candidate", handleIceCandidate);
    socket.on("ice_candidate", handleIceCandidate);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call_reconnect_offer", async ({ senderId, offer }) => {
      try {
        await handleReconnectOffer({ senderId, offer });
      } catch {
        setCallNotice({
          tone: "amber",
          title: "Reconnecting call",
          message: "Trying to recover call quality on this network.",
        });
      }
    });
    socket.on("call_reconnect_answer", async ({ answer }) => {
      try {
        await applyReconnectAnswer(answer);
      } catch {
        setCallNotice({
          tone: "amber",
          title: "Connection recovery delayed",
          message: "Call recovery is taking longer than expected.",
        });
      }
    });

    return () => {
      socket.off("receive_message", appendMessage);
      socket.off("typing");
      socket.off("presence:update", updatePresence);
      socket.off("connect");
      socket.off("queue_status");
      socket.off("match_found", handleMatchFound);
      socket.off("session_restored", restoreSession);
      socket.off("session_invalid");
      socket.off("session_message", appendSessionMessage);
      socket.off("disconnect_partner", handlePartnerDisconnect);
      socket.off("message_status");
      socket.off("incoming_call", handleIncomingCall);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call_outgoing");
      socket.off("call_unavailable");
      socket.off("call_timeout");
      socket.off("accept_call", handleAcceptCall);
      socket.off("accept-call", handleAcceptCall);
      socket.off("reject_call");
      socket.off("reject-call");
      socket.off("end_call", clearCall);
      socket.off("webrtc_ice_candidate", handleIceCandidate);
      socket.off("ice_candidate", handleIceCandidate);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call_reconnect_offer");
      socket.off("call_reconnect_answer");
    };
  }, [
    token,
    appendMessage,
    setTypingState,
    updatePresence,
    setQueueState,
    setMatch,
    restoreSession,
    appendSessionMessage,
    endRandomSession,
    setStrangerTyping,
    setOnlineCount,
    randomActiveSession,
    randomPartner,
    randomMode,
    setMessageStatus,
    setIncomingCall,
    startCallSession,
    setCallNotice,
    activeCall,
    clearCall,
    acceptIncomingCall,
    applyAnswer,
    applyIceCandidate,
    handleReconnectOffer,
    applyReconnectAnswer,
  ]);
};
