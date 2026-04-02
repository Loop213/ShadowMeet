import { motion } from "framer-motion";
import AppShell from "../components/layout/AppShell";
import { usePreferencesStore } from "../store/usePreferencesStore";
import ThemeToggle from "../components/common/ThemeToggle";

function SettingRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-line bg-white/5 px-5 py-4">
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative h-8 w-16 rounded-full transition ${
          checked ? "bg-gradient-to-r from-pink-500 to-fuchsia-500" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
            checked ? "left-9" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function SettingsPage() {
  const { notificationsEnabled, autoplayVideo, subtleMotion, setPreference } = usePreferencesStore();

  return (
    <AppShell>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-[2rem] p-6"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-pink-300">Settings</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Tune your vibe</h2>
        <p className="mt-2 text-sm text-slate-400">
          Control appearance, motion, and how active the platform feels around you.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-line bg-white/5 p-5">
            <p className="text-sm font-medium text-white">Appearance</p>
            <div className="mt-4">
              <ThemeToggle />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-line bg-white/5 p-5">
            <p className="text-sm font-medium text-white">Privacy</p>
            <p className="mt-3 text-sm text-slate-400">
              Anonymous usernames stay public. Only admins can see the protected identity layer.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <SettingRow
            title="Notifications"
            description="Get subtle updates when a stranger connects or a session changes state."
            checked={notificationsEnabled}
            onChange={() => setPreference("notifications", !notificationsEnabled)}
          />
          <SettingRow
            title="Autoplay Video"
            description="Open video-ready state immediately when you enter a random chat room."
            checked={autoplayVideo}
            onChange={() => setPreference("autoplay_video", !autoplayVideo)}
          />
          <SettingRow
            title="Subtle Motion"
            description="Reduce glow and movement if you prefer a calmer interface."
            checked={subtleMotion}
            onChange={() => setPreference("subtle_motion", !subtleMotion)}
          />
        </div>
      </motion.section>
    </AppShell>
  );
}

export default SettingsPage;

