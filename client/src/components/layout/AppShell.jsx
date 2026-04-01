import { LogOut, Shield, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

function AppShell({ children }) {
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-mesh px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="glass-panel rounded-3xl px-5 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-teal-300">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.3em]">ShadowDate</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-white">{user?.randomUsername}</h1>
              <p className="text-sm text-slate-400">
                Anonymous by default. Admins are the only ones who can see real identities.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/app"
                className={`rounded-full px-4 py-2 text-sm ${
                  pathname === "/app" ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-slate-300"
                }`}
              >
                Chat
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
                    pathname === "/admin"
                      ? "bg-orange-500 text-slate-950"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

export default AppShell;

