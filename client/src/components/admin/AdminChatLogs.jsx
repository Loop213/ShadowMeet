import { formatTime } from "../../lib/utils";

function AdminChatLogs({ messages = [] }) {
  return (
    <div className="glass-panel rounded-3xl p-4">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Moderation feed</p>
        <h3 className="mt-1 text-xl font-semibold text-white">Recent chat logs</h3>
      </div>
      <div className="scrollbar-thin max-h-[28rem] space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div key={message._id} className="rounded-2xl border border-line bg-slate-900/55 p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>{message.senderId?.randomUsername || "Unknown"}</span>
              <span>{message.receiverId?.randomUsername || "Global Room"}</span>
              <span>{message.messageType}</span>
              <span>{formatTime(message.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm text-slate-100">{message.content}</p>
            {message.moderation?.flagged && (
              <p className="mt-2 text-xs text-red-300">Flagged: {message.moderation.reason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminChatLogs;

