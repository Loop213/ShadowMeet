import { Heart, MapPin, Sparkle, X } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";

function DiscoverGrid({ users = [] }) {
  const swipeHistory = useChatStore((state) => state.swipeHistory);
  const registerSwipe = useChatStore((state) => state.registerSwipe);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <article key={user._id} className="discover-card glass-panel relative overflow-hidden rounded-[2rem] p-5">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-pink-500/15 via-fuchsia-500/10 to-orange-400/10 blur-2xl" />
          <div className="relative mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-[1.35rem] bg-gradient-to-br from-pink-500/80 via-fuchsia-500/70 to-orange-400/70 text-base font-semibold text-white shadow-lg shadow-pink-900/20">
                {user.randomUsername?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{user.randomUsername}</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                  <span className={`h-2 w-2 rounded-full ${user.isOnline ? "bg-emerald-400" : "bg-slate-500"}`} />
                  <span>{user.isOnline ? "Online now" : "Offline"}</span>
                  <span className="text-slate-500">•</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Anywhere
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-orange-500/15 p-3 text-orange-300">
              <Sparkle className="h-4 w-4" />
            </div>
          </div>
          <p className="min-h-16 text-sm leading-6 text-slate-300">
            {user.bio || "Mystery profile. Start a chat to discover the vibe."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(user.interests || []).slice(0, 4).map((interest) => (
              <span key={interest} className="rounded-full border border-white/10 bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
                {interest}
              </span>
            ))}
            {!(user.interests || []).length ? (
              <span className="rounded-full border border-dashed border-white/10 bg-slate-800/50 px-3 py-1 text-xs text-slate-400">
                Open to surprises
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => registerSwipe(user._id, "pass")}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-800/90 px-4 py-3 font-semibold text-slate-100 transition hover:border-white/20 hover:bg-slate-700/90"
            >
              <X className="h-4 w-4" />
              Pass
            </button>
            <button
              type="button"
              onClick={() => registerSwipe(user._id, "like")}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-900/20 transition hover:scale-[1.01]"
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
