import clsx from "clsx";
import { MessageCircleHeart, Radio, Video } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useCallStore } from "../../store/useCallStore";
import { useWebRTC } from "../../hooks/useWebRTC";

function ChatSidebar() {
  const { selectedChat, setSelectedChat, onlineUsers } = useChatStore();
  const activeCall = useCallStore((state) => state.activeCall);
  const { startOutgoingCall } = useWebRTC();

  return (
    <aside className="glass-panel flex min-h-[18rem] flex-col rounded-3xl p-4 lg:h-[calc(100dvh-10rem)]">
      <button
        type="button"
        onClick={() => setSelectedChat({ scope: "global", peer: null })}
        className={clsx(
          "mb-4 rounded-2xl border px-4 py-3 text-left transition",
          selectedChat.scope === "global"
            ? "border-teal-400 bg-teal-500/10"
            : "border-line bg-slate-900/60"
        )}
      >
        <div className="flex items-center gap-3">
          <Radio className="h-4 w-4 text-teal-300" />
          <div>
            <p className="font-medium text-white">Global Lounge</p>
            <p className="text-xs text-slate-400">Everyone online can see this room.</p>
          </div>
        </div>
      </button>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-300">Online now</p>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
          {onlineUsers.length}
        </span>
      </div>

      <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto pr-1">
        {onlineUsers.map((user) => {
          const isCallingUser =
            activeCall?.receiverId === user._id &&
            ["calling", "connecting", "reconnecting"].includes(activeCall?.status);

          return (
            <div
              key={user._id}
              className={clsx(
                "w-full rounded-2xl border px-3 py-3 text-left transition",
                selectedChat.peer?._id === user._id
                  ? "border-orange-400 bg-orange-500/10"
                  : "border-line bg-slate-900/50"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-sm font-bold text-teal-300">
                    {user.randomUsername.slice(0, 2).toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{user.randomUsername}</p>
                    <p className="text-xs text-slate-400">
                      {user.status || (user.isOnline ? "online" : "offline")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedChat({ scope: "private", peer: user })}
                  className="rounded-2xl bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Chat
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedChat({ scope: "private", peer: user });
                    if (isCallingUser) return;
                    try {
                      await startOutgoingCall({
                        receiverId: user._id,
                        type: "video",
                        chatScope: "private",
                      });
                    } catch {
                      // Call notice is managed in store.
                    }
                  }}
                  disabled={isCallingUser}
                  className="rounded-2xl bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Call ${user.randomUsername}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    {isCallingUser ? "Calling..." : "Call"}
                  </span>
                </button>
              </div>
            </div>
          );
        })}

        {!onlineUsers.length && (
          <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-slate-400">
            <MessageCircleHeart className="mb-2 h-4 w-4 text-orange-300" />
            No one is online right now. We will update this list in real time.
          </div>
        )}
      </div>
    </aside>
  );
}

export default ChatSidebar;
