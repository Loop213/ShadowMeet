import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Flag,
  Mic,
  PhoneOff,
  SendHorizontal,
  SkipForward,
  SmilePlus,
  Sparkles,
  UserRoundX,
  Video,
} from "lucide-react";
import { getSocket } from "../../services/socket";
import { useAuthStore } from "../../store/useAuthStore";
import { useCallStore } from "../../store/useCallStore";
import { useRandomChatStore } from "../../store/useRandomChatStore";
import { useWebRTC } from "../../hooks/useWebRTC";
import { formatTime } from "../../lib/utils";
import GifPicker from "./GifPicker";
import StickerPicker from "./StickerPicker";

const QUICK_EMOJIS = ["❤️", "🔥", "😊", "✨"];

function MessageBubble({ message, currentUserId }) {
  const senderId = typeof message.senderId === "object" ? message.senderId?._id : message.senderId;
  const senderName =
    typeof message.senderId === "object" ? message.senderId?.randomUsername : "Stranger";
  const isOwnMessage = senderId === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[88%] rounded-[1.5rem] border px-4 py-3 shadow-lg ${
          isOwnMessage
            ? "border-pink-400/20 bg-gradient-to-br from-pink-500/90 via-fuchsia-500/85 to-rose-500/85 text-white"
            : "border-white/10 bg-slate-950/75 text-slate-100"
        }`}
      >
        <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${isOwnMessage ? "text-white/70" : "text-slate-500"}`}>
          {isOwnMessage ? "You" : senderName || "Stranger"}
        </p>

        {message.messageType === "gif" || message.messageType === "image" ? (
          <img
            src={message.content}
            alt="Shared media"
            className="mt-2 max-h-64 w-full rounded-2xl object-cover"
          />
        ) : message.messageType === "sticker" ? (
          <div className="mt-2 text-4xl">{message.content}</div>
        ) : (
          <p className="mt-2 text-sm leading-6">{message.content}</p>
        )}

        <p className={`mt-2 text-[11px] ${isOwnMessage ? "text-white/70" : "text-slate-500"}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

function RandomChatPanel() {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const {
    queueStatus,
    queueSize,
    onlineCount,
    mode,
    interestsInput,
    genderFilter,
    activeSession,
    partner,
    sessionMessages,
    strangerTyping,
    setMode,
    setInterestsInput,
    setGenderFilter,
    startSearching,
    endSession,
  } = useRandomChatStore();
  const activeCall = useCallStore((state) => state.activeCall);
  const localStream = useCallStore((state) => state.localStream);
  const remoteStream = useCallStore((state) => state.remoteStream);
  const { startOutgoingCall, endCall } = useWebRTC();
  const [message, setMessage] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [mobileView, setMobileView] = useState("video");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const socket = getSocket(token);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const hasRemoteVideo = Boolean(remoteStream?.getVideoTracks?.().length);

  const interests = interestsInput
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream || null;
      localVideoRef.current.play?.().catch(() => {});
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
      remoteVideoRef.current.play?.().catch(() => {});
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream || null;
      remoteAudioRef.current.play?.().catch(() => {});
    }

    setAudioEnabled(localStream?.getAudioTracks().some((track) => track.enabled) ?? true);
    setVideoEnabled(localStream?.getVideoTracks().some((track) => track.enabled) ?? mode === "video");
  }, [localStream, remoteStream, mode]);

  const handleStart = () => {
    setMobileView("video");
    startSearching();
    socket.emit("find_partner", { interests, mode, genderFilter });
  };

  const handleSkip = () => {
    endCall();
    socket.emit("skip_partner");
    endSession();
  };

  const handleEndSession = () => {
    endCall();
    socket.emit("disconnect_partner");
    endSession();
  };

  const emitSessionMessage = ({ content, messageType = "text" }) => {
    if (!activeSession || !content) return;

    socket.emit("send_message", {
      chatScope: "session",
      sessionId: activeSession.sessionId,
      messageType,
      content,
    });
  };

  const handleSend = (event) => {
    event.preventDefault();
    if (!message.trim() || !activeSession) return;
    emitSessionMessage({ content: message.trim() });
    setMessage("");
  };

  const emitTyping = (value) => {
    setMessage(value);
    socket.emit("typing", {
      chatScope: "session",
      isTyping: value.length > 0,
    });
  };

  const toggleAudio = () => {
    const tracks = localStream?.getAudioTracks() || [];
    if (!tracks.length) return;
    const nextState = !tracks[0].enabled;
    tracks.forEach((track) => {
      track.enabled = nextState;
    });
    setAudioEnabled(nextState);
  };

  const toggleVideo = () => {
    const tracks = localStream?.getVideoTracks() || [];
    if (!tracks.length) return;
    const nextState = !tracks[0].enabled;
    tracks.forEach((track) => {
      track.enabled = nextState;
    });
    setVideoEnabled(nextState);
  };

  const handleCallStart = async (type) => {
    if (!partner?._id) return;
    try {
      await startOutgoingCall({ receiverId: partner._id, type });
    } catch {
      // Call notices are managed in WebRTC service.
    }
  };

  const connectionLabel = activeCall?.status === "connected"
    ? "Live now"
    : activeCall?.status === "calling" || activeCall?.status === "connecting"
      ? "Connecting..."
      : activeCall?.status === "reconnecting"
        ? "Reconnecting..."
        : activeCall?.status === "failed"
          ? "Connection failed"
          : activeSession
            ? "Matched"
            : queueStatus === "searching"
              ? "Searching..."
              : "Idle";

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel overflow-hidden rounded-[2rem] p-4 sm:p-5"
    >
      <div className="flex flex-col gap-4 border-b border-line pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-pink-300">Private video date</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {partner ? `Chatting with ${partner.randomUsername}` : "Meet a stranger in real time"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {activeSession
              ? "Your room stays alive across refresh and short reconnects until you end it."
              : "Anonymous matching with instant private chat, GIFs, stickers, and video."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-300">
            {onlineCount} online
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-300">
            {queueSize} waiting
          </span>
          <span className="rounded-full border border-pink-400/20 bg-pink-500/10 px-3 py-2 text-pink-200">
            {connectionLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2 rounded-full border border-line bg-slate-900/60 p-1 lg:hidden">
        {["video", "chat"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMobileView(value)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
              mobileView === value
                ? "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 text-white"
                : "text-slate-300"
            }`}
          >
            {value === "video" ? "Video" : "Chat"}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.4fr_0.6fr]">
        <div className={`${mobileView === "chat" ? "block" : "hidden"} space-y-4 lg:block`}>
          <div className="rounded-[2rem] border border-line bg-slate-900/60 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-pink-300">Private chat</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {partner ? `Say hi to ${partner.randomUsername}` : "Someone is waiting for you…"}
                </p>
              </div>
              {activeSession ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleEndSession}
                    className="rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-100"
                  >
                    End Session
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Next User
                  </button>
                </div>
              ) : null}
            </div>

            <div className="scrollbar-thin mb-4 flex max-h-[34rem] min-h-[26rem] flex-col gap-3 overflow-y-auto pr-1">
              {sessionMessages.map((entry, index) => (
                <MessageBubble
                  key={entry._id || `${entry.createdAt}-${index}`}
                  message={entry}
                  currentUserId={currentUser?._id}
                />
              ))}

              {strangerTyping ? <p className="text-xs text-pink-300">Stranger is typing…</p> : null}

              {!sessionMessages.length ? (
                <div className="rounded-[1.5rem] border border-dashed border-line bg-slate-950/40 p-5 text-sm text-slate-400">
                  Match found messages, emojis, stickers, and GIFs will appear here once you connect.
                </div>
              ) : null}
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  disabled={!activeSession}
                  onClick={() => emitSessionMessage({ content: emoji })}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition hover:border-pink-300/40 disabled:opacity-40"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="relative">
              {showGifPicker ? (
                <GifPicker
                  onSelect={(gifUrl) => {
                    emitSessionMessage({ content: gifUrl, messageType: "gif" });
                    setShowGifPicker(false);
                  }}
                />
              ) : null}
              {showStickerPicker ? (
                <StickerPicker
                  onSelect={(sticker) => {
                    emitSessionMessage({ content: sticker, messageType: "sticker" });
                    setShowStickerPicker(false);
                  }}
                />
              ) : null}

              <form onSubmit={handleSend} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 rounded-[1.75rem] border border-line bg-slate-950/70 px-3 py-3">
                  <button
                    type="button"
                    disabled={!activeSession}
                    onClick={() => setShowStickerPicker((current) => !current)}
                    className="rounded-2xl bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 disabled:opacity-40"
                  >
                    Stickers
                  </button>
                  <button
                    type="button"
                    disabled={!activeSession}
                    onClick={() => setShowGifPicker((current) => !current)}
                    className="rounded-2xl bg-slate-800 p-2 text-slate-300 disabled:opacity-40"
                  >
                    <SmilePlus className="h-4 w-4" />
                  </button>
                  <input
                    value={message}
                    onChange={(event) => emitTyping(event.target.value)}
                    disabled={!activeSession}
                    className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
                    placeholder={activeSession ? "Type something flirty or fun…" : "Start a chat to unlock messaging"}
                  />
                  <button
                    type="submit"
                    disabled={!activeSession}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <SendHorizontal className="h-4 w-4" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="rounded-[2rem] border border-line bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Match settings</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-400">Interests</label>
                <input
                  value={interestsInput}
                  onChange={(event) => setInterestsInput(event.target.value)}
                  className="w-full rounded-2xl border border-line bg-slate-950 px-4 py-3 text-sm outline-none"
                  placeholder="music, coding, movies"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["text", "voice", "video"].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMode(value)}
                        className={`rounded-2xl px-3 py-3 text-sm transition ${
                          mode === value
                            ? "bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-400">Gender filter</label>
                  <select
                    value={genderFilter}
                    onChange={(event) => setGenderFilter(event.target.value)}
                    className="w-full rounded-2xl border border-line bg-slate-950 px-4 py-3 text-sm outline-none"
                  >
                    <option value="any">Anyone</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="nonbinary">Non-binary</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStart}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 px-4 py-3 font-semibold text-white shadow-pulse"
              >
                {queueStatus === "searching" ? "Finding someone for you…" : "Start Chat ❤️"}
              </button>
            </div>
          </div>
        </div>

        <div className={`${mobileView === "video" ? "block" : "hidden"} space-y-4 lg:block`}>
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-slate-950/70 p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-fuchsia-500/10" />
            <div className="absolute left-8 top-6 h-28 w-28 rounded-full bg-pink-500/15 blur-3xl" />
            <div className="absolute bottom-8 right-6 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-pink-300">Video call</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {partner ? "Private video room" : "Connecting chamber"}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                {connectionLabel}
              </span>
            </div>

            <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/10 bg-black">
              <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
              <motion.video
                key={partner?._id || "empty-remote"}
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="remote-video h-full min-h-[28rem] w-full object-cover"
              />

              {!hasRemoteVideo || !activeCall ? (
                <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-24 w-24 rounded-full border border-pink-400/25 bg-pink-500/10">
                      <div className="pulse-ring mx-auto mt-2 h-20 w-20 rounded-full border border-pink-400/25" />
                    </div>
                    <p className="text-xl font-semibold text-white">
                      {activeCall ? "Waiting for remote video…" : activeSession ? "Call controls are ready" : "Finding someone for you…"}
                    </p>
                    <p className="mt-2 max-w-sm text-sm text-slate-300">
                      {activeCall
                        ? "The call is connected, but the other camera has not started sending video yet."
                        : activeSession
                        ? "Start a voice or video call when you feel the vibe."
                        : "Your screen stays live while we look for a new match."}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="absolute bottom-4 right-4 h-36 w-28 overflow-hidden rounded-[1.5rem] border border-white/15 bg-slate-950 shadow-2xl shadow-black/40">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="local-video h-full w-full object-cover"
                />
                {!localStream ? (
                  <div className="absolute inset-0 grid place-items-center bg-slate-950/85 text-xs text-slate-300">
                    Your preview
                  </div>
                ) : null}
              </div>

              <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAudio}
                    disabled={!localStream}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium text-white transition disabled:opacity-40 ${
                      audioEnabled ? "bg-white/10" : "bg-rose-500/80"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      {audioEnabled ? "Mute" : "Unmute"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleVideo}
                    disabled={!localStream}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium text-white transition disabled:opacity-40 ${
                      videoEnabled ? "bg-white/10" : "bg-rose-500/80"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      {videoEnabled ? "Camera" : "Show video"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEndSession}
                    disabled={!activeSession}
                    className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    <span className="inline-flex items-center gap-2">
                      <PhoneOff className="h-4 w-4" />
                      End
                    </span>
                  </button>
                </div>

                {partner ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCallStart("voice")}
                      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white"
                    >
                      Voice Call
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCallStart("video")}
                      className="rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Start Video
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
            <div className="rounded-[2rem] border border-line bg-slate-900/60 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-[1.35rem] bg-gradient-to-br from-pink-500/80 via-fuchsia-500/70 to-orange-400/70 text-base font-semibold text-white shadow-lg shadow-pink-900/20">
                  {partner?.randomUsername?.slice(0, 2).toUpperCase() || "??"}
                </div>
                <div>
                  <p className="font-semibold text-white">{partner?.randomUsername || "Mystery match"}</p>
                  <p className="text-xs text-slate-400">
                    {(partner?.interests || []).slice(0, 3).join(", ") || "Open to spontaneous conversations"}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                Refresh-safe session is enabled. Your room stays active until you press
                {" "}
                <span className="font-semibold text-white">End Session</span>.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
              <button
                type="button"
                onClick={() => socket.emit("report_user", {
                  reportedUserId: partner?._id,
                  sessionId: activeSession?.sessionId,
                  reason: "abuse",
                })}
                disabled={!partner}
                className="rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-rose-200 disabled:opacity-40"
              >
                <Flag className="mx-auto h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => socket.emit("block_user", { blockedUserId: partner?._id })}
                disabled={!partner}
                className="rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-rose-200 disabled:opacity-40"
              >
                <UserRoundX className="mx-auto h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={!activeSession}
                className="rounded-[1.5rem] border border-orange-400/20 bg-orange-500/10 px-4 py-4 text-orange-100 disabled:opacity-40"
              >
                <SkipForward className="mx-auto h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleStart}
                className="rounded-[1.5rem] border border-teal-400/20 bg-teal-500/10 px-4 py-4 text-teal-100"
              >
                <Sparkles className="mx-auto h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default RandomChatPanel;
