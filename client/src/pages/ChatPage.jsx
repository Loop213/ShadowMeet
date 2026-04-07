import { useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import RandomChatPanel from "../components/chat/RandomChatPanel";
import ThemeToggle from "../components/common/ThemeToggle";
import { getSocket } from "../services/socket";
import { useAuthStore } from "../store/useAuthStore";
import { useRandomChatStore } from "../store/useRandomChatStore";

function ChatPage() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const {
    queueStatus,
    mode,
    interestsInput,
    genderFilter,
    activeSession,
    startSearching,
  } = useRandomChatStore();

  useEffect(() => {
    if (!token || activeSession || queueStatus === "searching") return;

    const socket = getSocket(token);
    const interests = interestsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    startSearching();
    socket.emit("find_partner", { interests, mode, genderFilter });
  }, [token, activeSession, queueStatus, interestsInput, mode, genderFilter, startSearching]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!activeSession) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeSession]);

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-mesh px-4 py-4 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-[96rem] flex-col gap-4">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-[2rem] px-5 py-4"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
                Home
              </Link>
              <div>
                <div className="flex items-center gap-2 text-pink-300">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-[0.3em]">Live chat room</span>
                </div>
                <h1 className="mt-2 text-2xl font-bold text-white">
                  {user?.randomUsername || "Anonymous mode"}
                </h1>
                <p className="text-sm text-slate-400">
                  Full-screen private chat and video, separate from the landing page.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                to="/app"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200"
              >
                Open dashboard
              </Link>
            </div>
          </div>
        </motion.header>

        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex-1"
        >
          <RandomChatPanel />
        </motion.main>
      </div>
    </div>
  );
}

export default ChatPage;
