import { useEffect } from "react";
import { motion } from "framer-motion";
import { PhoneCall, PhoneOff } from "lucide-react";
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

  useEffect(() => {
    if (!incomingCall || typeof window === "undefined") return undefined;

    let intervalId;
    let audioContext;

    const startRingtone = async () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext = new AudioContextClass();

      const playRing = () => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.32);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.34);
      };

      playRing();
      intervalId = window.setInterval(playRing, 1400);
    };

    startRingtone().catch(() => {});

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      audioContext?.close?.().catch?.(() => {});
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel relative w-full max-w-md overflow-hidden rounded-[2rem] p-6 text-center"
      >
        <motion.div
          className="absolute left-1/2 top-8 h-28 w-28 -translate-x-1/2 rounded-full bg-pink-500/15 blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.55, 0.95, 0.55] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        <div className="relative">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-pink-400/30 bg-pink-500/10 text-pink-200">
            <PhoneCall className="h-8 w-8" />
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.3em] text-orange-300">Incoming {incomingCall.type}</p>
          <h2 className="mt-3 text-3xl font-bold text-white">{incomingCall.caller.randomUsername}</h2>
          <p className="mt-2 text-sm text-slate-400">Anonymous call request waiting for your response.</p>
          <div className="mt-6 flex gap-3">
            <Button className="flex-1 shadow-pulse" onClick={() => acceptIncomingCall(incomingCall)}>
              Accept
            </Button>
            <button
              type="button"
              onClick={() => {
                getSocket(token).emit("reject_call", {
                  callId: incomingCall.callId,
                  callerId: incomingCall.caller._id,
                });
                getSocket(token).emit("reject-call", {
                  callId: incomingCall.callId,
                  callerId: incomingCall.caller._id,
                });
                clearCall();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 font-medium text-slate-100"
            >
              <PhoneOff className="h-4 w-4" />
              Reject
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default IncomingCallModal;
