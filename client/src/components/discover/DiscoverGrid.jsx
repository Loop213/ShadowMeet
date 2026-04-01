import { Heart, Sparkle, X } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";

function DiscoverGrid({ users = [] }) {
  const swipeHistory = useChatStore((state) => state.swipeHistory);
  const registerSwipe = useChatStore((state) => state.registerSwipe);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <article key={user._id} className="glass-panel rounded-3xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-white">{user.randomUsername}</p>
              <p className="text-sm text-slate-400">{user.isOnline ? "Online now" : "Offline"}</p>
            </div>
            <div className="rounded-2xl bg-orange-500/15 p-3 text-orange-300">
              <Sparkle className="h-4 w-4" />
            </div>
          </div>
          <p className="min-h-12 text-sm text-slate-300">
            {user.bio || "Mystery profile. Start a chat to discover the vibe."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(user.interests || []).slice(0, 4).map((interest) => (
              <span key={interest} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {interest}
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => registerSwipe(user._id, "pass")}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 font-semibold text-slate-100"
            >
              <X className="h-4 w-4" />
              Pass
            </button>
            <button
              type="button"
              onClick={() => registerSwipe(user._id, "like")}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-500 px-4 py-3 font-semibold text-slate-950"
            >
              <Heart className="h-4 w-4" />
              {swipeHistory[user._id] === "like" ? "Liked" : "Match vibe"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default DiscoverGrid;
