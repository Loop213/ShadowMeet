import { useState } from "react";
import { ImagePlus, Mic, SendHorizontal, SmilePlus, Video } from "lucide-react";
import { getSocket } from "../../services/socket";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { uploadAsset } from "../../services/cloudinary";
import GifPicker from "./GifPicker";
import StickerPicker from "./StickerPicker";
import { useWebRTC } from "../../hooks/useWebRTC";

function Composer() {
  const token = useAuthStore((state) => state.token);
  const selectedChat = useChatStore((state) => state.selectedChat);
  const [message, setMessage] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const { startOutgoingCall } = useWebRTC();

  const emitMessage = ({ content, messageType = "text" }) => {
    const socket = getSocket(token);
    socket.emit("send_message", {
      chatScope: selectedChat.scope,
      receiverId: selectedChat.peer?._id || null,
      content,
      messageType,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    emitMessage({ content: message.trim() });
    setMessage("");
  };

  const handleTyping = (value) => {
    setMessage(value);
    const socket = getSocket(token);
    socket.emit("typing", {
      chatScope: selectedChat.scope,
      receiverId: selectedChat.peer?._id || null,
      isTyping: value.length > 0,
    });
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await uploadAsset(file);
    emitMessage({ content: url, messageType: "image" });
  };

  const handleCallStart = async (type) => {
    if (!selectedChat.peer?._id) return;
    try {
      await startOutgoingCall({ receiverId: selectedChat.peer._id, type, chatScope: "private" });
    } catch {
      // Call notices are managed inside the WebRTC service.
    }
  };

  return (
    <div className="relative border-t border-line pt-4">
      {showGifPicker && (
        <GifPicker
          onSelect={(gifUrl) => {
            emitMessage({ content: gifUrl, messageType: "gif" });
            setShowGifPicker(false);
          }}
        />
      )}
      {showStickerPicker && (
        <StickerPicker
          onSelect={(sticker) => {
            emitMessage({ content: sticker, messageType: "sticker" });
            setShowStickerPicker(false);
          }}
        />
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-3xl border border-line bg-slate-900/80 px-3 py-3">
          <button
            type="button"
            onClick={() => setShowGifPicker((current) => !current)}
            className="rounded-2xl bg-slate-800 p-2 text-slate-300"
          >
            <SmilePlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowStickerPicker((current) => !current)}
            className="rounded-2xl bg-slate-800 px-3 py-2 text-sm text-slate-300"
          >
            Stickers
          </button>
          <label className="cursor-pointer rounded-2xl bg-slate-800 p-2 text-slate-300">
            <ImagePlus className="h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
          <input
            value={message}
            onChange={(event) => handleTyping(event.target.value)}
            placeholder={
              selectedChat.scope === "global"
                ? "Say something to the whole room..."
                : `Message ${selectedChat.peer?.randomUsername}`
            }
            className="flex-1 bg-transparent text-sm outline-none"
          />
          {selectedChat.scope === "private" && (
            <>
              <button
                type="button"
                onClick={() => handleCallStart("voice")}
                className="rounded-2xl bg-slate-800 p-2 text-slate-300"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCallStart("video")}
                className="rounded-2xl bg-slate-800 p-2 text-slate-300"
              >
                <Video className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-3xl bg-teal-500 px-5 py-3 font-semibold text-slate-950"
        >
          <SendHorizontal className="h-4 w-4" />
          Send
        </button>
      </form>
    </div>
  );
}

export default Composer;
