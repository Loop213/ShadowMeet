import { useEffect, useRef } from "react";
import clsx from "clsx";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { formatTime } from "../../lib/utils";
import ReactionBar from "./ReactionBar";

function MessageList() {
  const user = useAuthStore((state) => state.user);
  const { selectedChat, globalMessages, privateMessages, typingUsers, messageStatuses, reactToMessage } =
    useChatStore();
  const bottomRef = useRef(null);

  const messages =
    selectedChat.scope === "global"
      ? globalMessages
      : privateMessages[selectedChat.peer?._id] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat]);

  const typingKey =
    selectedChat.scope === "global"
      ? "global:"
      : `private:${selectedChat.peer?._id || ""}`;

  const renderStatus = (message) => {
    if (selectedChat.scope !== "private") return null;
    const status = messageStatuses[message._id]?.status;
    if (!status) return null;
    return <span className="ml-2 text-[11px] opacity-60">{status}</span>;
  };

  return (
    <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-1">
      {messages.map((message) => {
        const isMine = message.senderId?._id === user?._id;
        const senderLabel = isMine ? "You" : message.senderId?.randomUsername;

        return (
          <div key={message._id} className={clsx("flex", isMine ? "justify-end" : "justify-start")}>
            <div
              className={clsx(
                "max-w-[80%] rounded-3xl px-4 py-3",
                isMine ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-slate-100"
              )}
            >
              <p className="mb-1 text-xs font-semibold opacity-75">{senderLabel}</p>
              {message.messageType === "gif" || message.messageType === "image" ? (
                <img src={message.content} alt={message.messageType} className="max-h-64 rounded-2xl" />
              ) : message.messageType === "sticker" ? (
                <div className="text-5xl">{message.content}</div>
              ) : (
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              )}
              <p className="mt-2 text-[11px] opacity-70">
                {formatTime(message.createdAt)}
                {isMine && renderStatus(message)}
              </p>
              <ReactionBar onReact={(emoji) => reactToMessage(message._id, emoji)} />
              {message.reactions?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.reactions.map((reaction, index) => (
                    <span key={`${reaction.userId}-${index}`} className="rounded-full bg-black/20 px-2 py-1 text-xs">
                      {reaction.emoji}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {Object.entries(typingUsers).some(([key, value]) => key.includes(typingKey) && value) && (
        <div className="text-xs text-slate-400">Someone is typing...</div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
