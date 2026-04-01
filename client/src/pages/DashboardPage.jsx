import { useEffect } from "react";
import AppShell from "../components/layout/AppShell";
import ChatSidebar from "../components/chat/ChatSidebar";
import MessageList from "../components/chat/MessageList";
import Composer from "../components/chat/Composer";
import RandomChatPanel from "../components/chat/RandomChatPanel";
import DiscoverGrid from "../components/discover/DiscoverGrid";
import ProfileCard from "../components/discover/ProfileCard";
import { useChatStore } from "../store/useChatStore";
import { useRandomChatStore } from "../store/useRandomChatStore";

function DashboardPage() {
  const { fetchBootstrap, selectedChat, discoverUsers, fetchPrivateMessages } = useChatStore();
  const fetchMatchHistory = useRandomChatStore((state) => state.fetchMatchHistory);

  useEffect(() => {
    fetchBootstrap();
    fetchMatchHistory();
  }, [fetchBootstrap, fetchMatchHistory]);

  useEffect(() => {
    if (selectedChat.scope === "private" && selectedChat.peer?._id) {
      fetchPrivateMessages(selectedChat.peer._id);
    }
  }, [selectedChat, fetchPrivateMessages]);

  return (
    <AppShell>
      <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
        <ChatSidebar />
        <section className="grid gap-4">
          <RandomChatPanel />
          <div className="glass-panel flex h-[calc(100vh-10rem)] flex-col rounded-3xl p-4">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {selectedChat.scope === "global" ? "Public room" : "Private chat"}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  {selectedChat.scope === "global"
                    ? "Global Lounge"
                    : selectedChat.peer?.randomUsername || "Conversation"}
                </h2>
              </div>
              {selectedChat.scope === "private" && (
                <span className="rounded-full bg-slate-800 px-3 py-2 text-xs text-slate-300">
                  End-to-end via WebRTC calls
                </span>
              )}
            </div>
            <MessageList />
            <Composer />
          </div>

          <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
            <ProfileCard />
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-orange-300">Discover</p>
                  <h3 className="text-2xl font-semibold text-white">Suggested anonymous matches</h3>
                </div>
              </div>
              <DiscoverGrid users={discoverUsers.slice(0, 6)} />
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default DashboardPage;
