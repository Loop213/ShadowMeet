import {
  acceptIncomingCall as acceptIncomingCallService,
  applyAnswer as applyAnswerService,
  applyIceCandidate as applyIceCandidateService,
  applyReconnectAnswer as applyReconnectAnswerService,
  endCall as endCallService,
  handleReconnectOffer as handleReconnectOfferService,
  startOutgoingCall as startOutgoingCallService,
} from "../services/webrtc";
import { useAuthStore } from "../store/useAuthStore";

export const useWebRTC = () => {
  const token = useAuthStore((state) => state.token);

  const startOutgoingCall = async ({ receiverId, type }) => {
    await startOutgoingCallService({ token, receiverId, type });
  };

  const acceptIncomingCall = async (incomingCall) => {
    await acceptIncomingCallService({ token, incomingCall });
  };

  const applyAnswer = async (answer) => applyAnswerService(answer);

  const applyIceCandidate = async (candidate) => applyIceCandidateService(candidate);

  const handleReconnectOffer = async ({ senderId, offer }) =>
    handleReconnectOfferService({ token, senderId, offer });

  const applyReconnectAnswer = async (answer) => applyReconnectAnswerService(answer);

  const endCall = () => endCallService(token);

  return {
    startOutgoingCall,
    acceptIncomingCall,
    applyAnswer,
    applyIceCandidate,
    handleReconnectOffer,
    applyReconnectAnswer,
    endCall,
  };
};
