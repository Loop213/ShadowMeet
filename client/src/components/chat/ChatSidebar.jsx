import clsx from "clsx";
import { MessageCircleHeart, Radio } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";

function ChatSidebar() {
  const { selectedChat, setSelectedChat, discoverUsers, onlineUsers } = useChatStore();

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
        {discoverUsers.map((user) => (
          <button
            key={user._id}
            type="button"
            onClick={() => setSelectedChat({ scope: "private", peer: user })}
            className={clsx(
              "w-full rounded-2xl border px-3 py-3 text-left transition",
              selectedChat.peer?._id === user._id
                ? "border-orange-400 bg-orange-500/10"
                : "border-line bg-slate-900/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-sm font-bold text-teal-300">
                {user.randomUsername.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-white">{user.randomUsername}</p>
                <p className="text-xs text-slate-400">
                  {user.isOnline ? "Available now" : "Tap to open private chat"}
                </p>
              </div>
            </div>
          </button>
        ))}

        {!discoverUsers.length && (
          <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-slate-400">
            <MessageCircleHeart className="mb-2 h-4 w-4 text-orange-300" />
            Waiting for more anonymous profiles to appear.
          </div>
        )}
      </div>
    </aside>
  );
}

export default ChatSidebar;
