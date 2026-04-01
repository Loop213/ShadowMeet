import { useState } from "react";
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
    <section className="glass-panel rounded-3xl p-5">
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

      <div className="mt-4 grid gap-4 xl:grid-cols-[22rem_1fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-slate-900/60 p-4">
            <label className="mb-2 block text-sm text-slate-400">Chat mode</label>
            <div className="grid grid-cols-3 gap-2">
              {["text", "voice", "video"].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`rounded-2xl px-3 py-3 text-sm ${
                    mode === value ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-slate-900/60 p-4">
            <label className="mb-2 block text-sm text-slate-400">Interests</label>
            <input
              value={interestsInput}
              onChange={(event) => setInterestsInput(event.target.value)}
              className="w-full rounded-2xl border border-line bg-slate-950 px-4 py-3 text-sm outline-none"
              placeholder="music, coding, movies"
            />
            <label className="mb-2 mt-4 block text-sm text-slate-400">Filter</label>
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
            <button
              type="button"
              onClick={handleStart}
              className="mt-4 w-full rounded-2xl bg-teal-500 px-4 py-3 font-semibold text-slate-950"
            >
              {queueStatus === "searching" ? "Searching..." : "Start Chat"}
            </button>
            {activeSession && (
              <button
                type="button"
                onClick={handleSkip}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-slate-950"
              >
                <SkipForward className="h-4 w-4" />
                Next Stranger
              </button>
            )}
          </div>

          {partner && (
            <div className="rounded-3xl border border-line bg-slate-900/60 p-4">
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

        <div className="flex min-h-[34rem] flex-col rounded-3xl border border-line bg-slate-900/55 p-4">
          <div className="mb-4 grid flex-1 gap-4 md:grid-cols-2">
            <div className="grid place-items-center rounded-3xl bg-slate-950">
              <p className="text-sm text-slate-400">Your camera preview appears during calls</p>
            </div>
            <div className="grid place-items-center rounded-3xl bg-slate-950">
              <p className="text-sm text-slate-400">
                {partner ? "Stranger video area" : "Connect to a stranger to start"}
              </p>
            </div>
          </div>

          <div className="scrollbar-thin mb-4 max-h-64 flex-1 space-y-3 overflow-y-auto pr-1">
            {sessionMessages.map((message) => (
              <div key={message._id} className="rounded-2xl bg-slate-950/70 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400">
                  {message.senderId?.randomUsername || "Stranger"}
                </p>
                <p className="mt-1 text-sm text-white">{message.content}</p>
                <p className="mt-1 text-[11px] text-slate-500">{formatTime(message.createdAt)}</p>
              </div>
            ))}
            {strangerTyping && <p className="text-xs text-slate-400">Stranger is typing...</p>}
            {!sessionMessages.length && (
              <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-slate-400">
                Session chat is ephemeral and auto-deletes when the stranger leaves.
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-3">
            <input
              value={message}
              onChange={(event) => emitTyping(event.target.value)}
              disabled={!activeSession}
              className="flex-1 rounded-2xl border border-line bg-slate-950 px-4 py-3 text-sm outline-none disabled:opacity-50"
              placeholder={activeSession ? "Say hi to your stranger..." : "Start a chat to unlock messaging"}
            />
            <button
              type="submit"
              disabled={!activeSession}
              className="rounded-2xl bg-teal-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default RandomChatPanel;
