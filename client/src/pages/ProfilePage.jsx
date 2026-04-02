import { motion } from "framer-motion";
import AppShell from "../components/layout/AppShell";
import ProfileCard from "../components/discover/ProfileCard";
import { useRandomChatStore } from "../store/useRandomChatStore";

function ProfilePage() {
  const matchHistory = useRandomChatStore((state) => state.matchHistory);

  return (
    <AppShell>
      <div className="grid gap-4 xl:grid-cols-[24rem_1fr]">
        <ProfileCard />
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-[2rem] p-6"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-pink-300">Match history</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Recent anonymous moments</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Temporary memory of your latest stranger sessions, designed to feel personal without exposing identity.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {matchHistory.slice(0, 6).map((session) => (
              <article key={session._id} className="rounded-[1.75rem] border border-line bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-orange-300">{session.mode} session</p>
                <p className="mt-3 text-lg font-semibold text-white">
                  {session.user1?.randomUsername} • {session.user2?.randomUsername}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Interests: {session.matchedInterests?.join(", ") || "Unexpected chemistry"}
                </p>
                <p className="mt-4 text-xs text-slate-500">
                  Status: {session.status} • Started {new Date(session.startTime).toLocaleString()}
                </p>
              </article>
            ))}

            {!matchHistory.length && (
              <div className="rounded-[1.75rem] border border-dashed border-line p-6 text-sm text-slate-400">
                No recent sessions yet. Start a random chat and your activity story begins here.
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </AppShell>
  );
}

export default ProfilePage;

