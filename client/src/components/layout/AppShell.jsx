import { Home, LogOut, Settings, Shield, Sparkles, UserCircle2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import ThemeToggle from "../common/ThemeToggle";

function AppShell({ children }) {
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navItems = [
    { to: "/app", label: "Discover", icon: Home },
    { to: "/profile", label: "Profile", icon: UserCircle2 },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-mesh px-4 py-4 pb-24 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="glass-panel rounded-[2rem] px-5 py-4">
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
              <ThemeToggle />
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`hidden rounded-full px-4 py-2 text-sm lg:inline-flex ${
                    pathname === item.to ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
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

      <nav className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-xl rounded-[1.75rem] border border-line bg-slate-950/88 p-2 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-xs ${
                  active ? "bg-teal-500 text-slate-950" : "text-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {user?.role === "admin" && pathname === "/admin" && (
            <Link to="/admin" className="flex flex-col items-center gap-1 rounded-2xl bg-orange-500 px-3 py-3 text-xs text-slate-950">
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}

export default AppShell;
