import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/common/ThemeToggle";
import Button from "../components/common/Button";
import { useAuthStore } from "../store/useAuthStore";

function AuthPage() {
  const { authMode, setAuthMode, login, register, requestOtp, enterGuestMode, loading } =
    useAuthStore();
  const [form, setForm] = useState({ email: "", password: "", otp: "" });
  const [error, setError] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      if (authMode === "register") {
        await register({ email: form.email, password: form.password });
      } else if (authMode === "guest") {
        await enterGuestMode({});
      } else if (authMode === "otp") {
        await login({ email: form.email, otp: form.otp }, "otp");
      } else {
        await login({ email: form.email, password: form.password });
      }
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const handleRequestOtp = async () => {
    await requestOtp(form.email);
    setOtpRequested(true);
  };

  return (
    <div className="auth-shell flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel relative overflow-hidden rounded-[2rem] p-8 lg:p-10"
        >
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="text-sm text-slate-400 transition hover:text-white">
              ← Back to home
            </Link>
            <ThemeToggle />
          </div>
          <p className="text-sm uppercase tracking-[0.35em] text-teal-300">Anonymous dating platform</p>
          <h1 className="mt-4 max-w-xl text-5xl font-bold leading-tight text-white">
            Meet real people without exposing your identity to everyone.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-300">
            Random usernames, real-time global chat, private conversations, GIFs, stickers, voice
            calls, video calls, and admin-only identity controls.
          </p>
          <div className="absolute -right-16 top-8 h-44 w-44 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {["Global live room", "Private chats + media", "WebRTC voice/video"].map((item) => (
              <div key={item} className="rounded-3xl border border-line bg-slate-900/70 p-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel rounded-[2rem] p-8"
        >
          <div className="mb-6 flex rounded-2xl bg-slate-900/80 p-1">
            {[
              { key: "login", label: "Password" },
              { key: "otp", label: "OTP" },
              { key: "register", label: "Register" },
              { key: "guest", label: "Guest" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setAuthMode(item.key)}
                className={`flex-1 rounded-2xl px-3 py-3 text-sm ${
                  authMode === item.key ? "bg-teal-500 text-slate-950" : "text-slate-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode !== "guest" && (
              <div>
                <label className="mb-2 block text-sm text-slate-400">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="w-full rounded-2xl border border-line bg-slate-900 px-4 py-3 outline-none transition focus:border-pink-400"
                  placeholder="you@example.com"
                  required
                />
              </div>
            )}

            {authMode !== "otp" && authMode !== "guest" && (
              <div>
                <label className="mb-2 block text-sm text-slate-400">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className="w-full rounded-2xl border border-line bg-slate-900 px-4 py-3 outline-none transition focus:border-pink-400"
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>
            )}

            {authMode === "otp" && (
              <>
                <div>
                  <label className="mb-2 block text-sm text-slate-400">One-time code</label>
                  <input
                    type="text"
                    value={form.otp}
                    onChange={(event) => updateField("otp", event.target.value)}
                    className="w-full rounded-2xl border border-line bg-slate-900 px-4 py-3 outline-none transition focus:border-pink-400"
                    placeholder="6-digit code"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="w-full rounded-2xl border border-line bg-slate-900 px-4 py-3 text-sm text-slate-200"
                >
                  {otpRequested ? "OTP sent. Check email." : "Send OTP"}
                </button>
              </>
            )}

            {error && <p className="text-sm text-red-300">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Please wait..."
                : authMode === "register"
                  ? "Create account"
                  : authMode === "guest"
                    ? "Enter as guest"
                    : "Continue"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-slate-500">
            Your public identity is auto-generated. No manual username input is allowed.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Google OAuth can be added next on top of this flow without changing the anonymous UX.
          </p>
        </motion.section>
      </div>
    </div>
  );
}

export default AuthPage;
