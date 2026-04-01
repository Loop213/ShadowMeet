import Button from "../common/Button";
import { useCallStore } from "../../store/useCallStore";
import { getSocket } from "../../services/socket";
import { useAuthStore } from "../../store/useAuthStore";
import { useWebRTC } from "../../hooks/useWebRTC";

function IncomingCallModal() {
  const incomingCall = useCallStore((state) => state.incomingCall);
  const clearCall = useCallStore((state) => state.clearCall);
  const token = useAuthStore((state) => state.token);
  const { acceptIncomingCall } = useWebRTC();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-orange-300">Incoming {incomingCall.type}</p>
        <h2 className="mt-3 text-3xl font-bold text-white">{incomingCall.caller.randomUsername}</h2>
        <p className="mt-2 text-sm text-slate-400">Anonymous call request waiting for your response.</p>
        <div className="mt-6 flex gap-3">
          <Button className="flex-1" onClick={() => acceptIncomingCall(incomingCall)}>
            Accept
          </Button>
          <button
            type="button"
            onClick={() => {
              getSocket(token).emit("reject_call", {
                callId: incomingCall.callId,
                callerId: incomingCall.caller._id,
              });
              clearCall();
            }}
            className="flex-1 rounded-2xl bg-slate-800 px-4 py-3 font-medium text-slate-100"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallModal;

