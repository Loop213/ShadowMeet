import { useEffect } from "react";
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
  const appendSessionMessage = useRandomChatStore((state) => state.appendSessionMessage);
  const endRandomSession = useRandomChatStore((state) => state.endSession);
  const setStrangerTyping = useRandomChatStore((state) => state.setStrangerTyping);
  const setOnlineCount = useRandomChatStore((state) => state.setOnlineCount);
  const setIncomingCall = useCallStore((state) => state.setIncomingCall);
  const clearCall = useCallStore((state) => state.clearCall);
  const { applyAnswer, applyIceCandidate } = useWebRTC();

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
    socket.on("queue_status", ({ status, queueSize }) => {
      setQueueState({ queueStatus: status, queueSize });
      setOnlineCount(queueSize || 0);
    });
    socket.on("match_found", setMatch);
    socket.on("session_message", appendSessionMessage);
    socket.on("disconnect_partner", endRandomSession);
    socket.on("message_status", ({ messageId, status, seenBy }) => {
      setMessageStatus(messageId, { status, seenBy });
    });
    socket.on("incoming_call", setIncomingCall);
    socket.on("accept_call", async ({ answer }) => {
      await applyAnswer(answer);
    });
    socket.on("reject_call", clearCall);
    socket.on("end_call", clearCall);
    socket.on("webrtc_ice_candidate", async ({ candidate }) => {
      await applyIceCandidate(candidate);
    });
    socket.on("ice_candidate", async ({ candidate }) => {
      await applyIceCandidate(candidate);
    });

    return () => {
      socket.off("receive_message", appendMessage);
      socket.off("typing");
      socket.off("presence:update", updatePresence);
      socket.off("queue_status");
      socket.off("match_found", setMatch);
      socket.off("session_message", appendSessionMessage);
      socket.off("disconnect_partner", endRandomSession);
      socket.off("message_status");
      socket.off("incoming_call", setIncomingCall);
      socket.off("accept_call");
      socket.off("reject_call", clearCall);
      socket.off("end_call", clearCall);
      socket.off("webrtc_ice_candidate");
      socket.off("ice_candidate");
    };
  }, [
    token,
    appendMessage,
    setTypingState,
    updatePresence,
    setQueueState,
    setMatch,
    appendSessionMessage,
    endRandomSession,
    setStrangerTyping,
    setOnlineCount,
    setMessageStatus,
    setIncomingCall,
    clearCall,
    applyAnswer,
    applyIceCandidate,
  ]);
};
