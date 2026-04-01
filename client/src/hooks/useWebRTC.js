import {
  acceptIncomingCall as acceptIncomingCallService,
  applyAnswer as applyAnswerService,
  applyIceCandidate as applyIceCandidateService,
  endCall as endCallService,
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

  const endCall = () => endCallService(token);

  return {
    startOutgoingCall,
    acceptIncomingCall,
    applyAnswer,
    applyIceCandidate,
    endCall,
  };
};
