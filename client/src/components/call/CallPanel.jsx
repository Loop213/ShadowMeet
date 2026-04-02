import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCallStore } from "../../store/useCallStore";
import { useWebRTC } from "../../hooks/useWebRTC";

function CallPanel() {
  const { activeCall, localStream, remoteStream } = useCallStore();
  const { endCall } = useWebRTC();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play?.().catch(() => {});
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play?.().catch(() => {});
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play?.().catch(() => {});
    }
  }, [localStream, remoteStream]);

  if (!activeCall) return null;

  const toggleAudio = () => {
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setAudioMuted(!track.enabled);
    });
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setVideoMuted(!track.enabled);
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(24rem,calc(100vw-2rem))] rounded-3xl border border-line bg-slate-950/92 p-4 shadow-glow">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-teal-300">{activeCall.type} call</p>
          <p className="text-lg font-semibold text-white">{activeCall.status}</p>
        </div>
        <button
          type="button"
          onClick={endCall}
          className="rounded-full bg-red-500/20 p-2 text-red-300"
        >
          <PhoneOff className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="aspect-video rounded-2xl bg-slate-900 object-cover"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="aspect-video rounded-2xl bg-slate-900 object-cover"
        />
      </div>
      <div className="mt-4 flex justify-center gap-3">
        <button type="button" onClick={toggleAudio} className="rounded-full bg-slate-800 p-3">
          {audioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button type="button" onClick={toggleVideo} className="rounded-full bg-slate-800 p-3">
          {videoMuted ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default CallPanel;
