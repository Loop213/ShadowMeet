import { useState } from "react";
import { motion } from "framer-motion";
import { Flag, Mic, SkipForward, UserRoundX, Video } from "lucide-react";
import { getSocket } from "../../services/socket";
import { useAuthStore } from "../../store/useAuthStore";
import { useRandomChatStore } from "../../store/useRandomChatStore";
import { useWebRTC } from "../../hooks/useWebRTC";
import { formatTime } from "../../lib/utils";

function RandomChatPanel() {
  const token = useAuthStore((state) => state.token);
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
  const { startOutgoingCall } = useWebRTC();
  const [message, setMessage] = useState("");

  const socket = getSocket(token);

  const interests = interestsInput
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const handleStart = () => {
    startSearching();
    socket.emit("find_partner", { interests, mode, genderFilter });
  };

  const handleSkip = () => {
    socket.emit("skip_partner");
    endSession();
  };

  const handleSend = (event) => {
    event.preventDefault();
    if (!message.trim() || !activeSession) return;
    socket.emit("send_message", {
      chatScope: "session",
      sessionId: activeSession.sessionId,
      messageType: "text",
      content: message.trim(),
    });
    setMessage("");
  };

  const emitTyping = (value) => {
    setMessage(value);
    socket.emit("typing", {
      chatScope: "session",
      isTyping: value.length > 0,
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-[2rem] p-5"
    >
      <div className="flex flex-col gap-4 border-b border-line pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Random stranger mode</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            {partner ? `Talking to ${partner.randomUsername}` : "Instant anonymous matching"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {queueStatus === "searching"
              ? `Finding a ${mode} partner...`
              : "Omegle-style fast queue with optional interest matching."}
          </p>
        </div>
        <div className="flex gap-3 text-xs text-slate-300">
          <span className="rounded-full bg-slate-800 px-3 py-2">{onlineCount} online</span>
          <span className="rounded-full bg-slate-800 px-3 py-2">{queueSize} waiting</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-slate-950/55 p-4">
            <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-pink-500/20 blur-3xl" />
            <div className="absolute bottom-4 left-4 h-24 w-24 rounded-full bg-fuchsia-500/15 blur-3xl" />
            <div className="relative mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-pink-300">Video Room</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {partner ? "Connection looks promising" : "Waiting for someone special"}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                {activeSession ? "Connected" : queueStatus}
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="video-frame relative min-h-[23rem] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-fuchsia-500/10" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="pulse-ring absolute h-28 w-28 rounded-full border border-pink-400/25" />
                  <p className="relative z-10 max-w-xs text-center text-sm text-slate-300">
                    {partner
                      ? `${partner.randomUsername} is in the room. Start the vibe with video or voice.`
                      : "Finding someone for you… don’t miss your match."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="video-frame grid min-h-[11rem] place-items-center rounded-[1.75rem] border border-white/10 bg-slate-950 text-sm text-slate-400">
                  Your preview
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button type="button" className="rounded-2xl bg-white/5 px-4 py-3 text-slate-100">
                    <Mic className="mx-auto h-4 w-4" />
                  </button>
                  <button type="button" className="rounded-2xl bg-white/5 px-4 py-3 text-slate-100">
                    <Video className="mx-auto h-4 w-4" />
                  </button>
                  <button type="button" onClick={handleSkip} className="rounded-2xl bg-rose-500/90 px-4 py-3 text-white">
                    <SkipForward className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-line bg-slate-900/60 p-4">
            <label className="mb-2 block text-sm text-slate-400">Interests</label>
            <input
              value={interestsInput}
              onChange={(event) => setInterestsInput(event.target.value)}
              className="w-full rounded-2xl border border-line bg-slate-950 px-4 py-3 text-sm outline-none"
              placeholder="music, coding, movies"
            />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-400">Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {["text", "voice", "video"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      className={`rounded-2xl px-3 py-3 text-sm ${
                        mode === value ? "bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white" : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-400">Gender Filter</label>
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
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 px-4 py-3 font-semibold text-white shadow-pulse"
            >
              {queueStatus === "searching" ? "Finding someone for you…" : "Start Chat ❤️"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-slate-900/60 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-pink-300">Live chat</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {partner ? `Say hi to ${partner.randomUsername}` : "Someone is waiting for you…"}
                </p>
              </div>
              {activeSession && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white"
                >
                  Next User
                </button>
              )}
            </div>

            <div className="scrollbar-thin mb-4 max-h-[30rem] min-h-[24rem] space-y-3 overflow-y-auto pr-1">
              {sessionMessages.map((message) => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="rounded-2xl bg-slate-950/70 px-4 py-3"
                >
                  <p className="text-xs font-semibold text-slate-400">
                    {message.senderId?.randomUsername || "Stranger"}
                  </p>
                  <p className="mt-1 text-sm text-white">{message.content}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{formatTime(message.createdAt)}</p>
                </motion.div>
              ))}
              {strangerTyping && <p className="text-xs text-pink-300">User is typing…</p>}
              {!sessionMessages.length && (
                <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-slate-400">
                  Match found animation, ephemeral chat, and premium bubbles all begin once you connect.
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="flex gap-3">
              <input
                value={message}
                onChange={(event) => emitTyping(event.target.value)}
                disabled={!activeSession}
                className="flex-1 rounded-2xl border border-line bg-slate-950 px-4 py-3 text-sm outline-none disabled:opacity-50"
                placeholder={activeSession ? "Type your message…" : "Start a chat to unlock messaging"}
              />
              <button
                type="submit"
                disabled={!activeSession}
                className="rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>

          {partner && (
            <div className="rounded-[2rem] border border-line bg-slate-900/60 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={partner.anonymousAvatar}
                  alt={partner.randomUsername}
                  className="h-14 w-14 rounded-2xl bg-slate-800"
                />
                <div>
                  <p className="font-semibold text-white">{partner.randomUsername}</p>
                  <p className="text-xs text-slate-400">
                    Interests: {(partner.interests || []).slice(0, 3).join(", ") || "open chat"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => startOutgoingCall({ receiverId: partner._id, type: "voice" })}
                  className="flex-1 rounded-2xl bg-slate-800 px-4 py-3"
                >
                  <Mic className="mx-auto h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => startOutgoingCall({ receiverId: partner._id, type: "video" })}
                  className="flex-1 rounded-2xl bg-slate-800 px-4 py-3"
                >
                  <Video className="mx-auto h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    socket.emit("report_user", {
                      reportedUserId: partner._id,
                      sessionId: activeSession?.sessionId,
                      reason: "abuse",
                    })
                  }
                  className="flex-1 rounded-2xl bg-red-500/20 px-4 py-3 text-red-300"
                >
                  <Flag className="mx-auto h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => socket.emit("block_user", { blockedUserId: partner._id })}
                  className="flex-1 rounded-2xl bg-red-500/20 px-4 py-3 text-red-300"
                >
                  <UserRoundX className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export default RandomChatPanel;
