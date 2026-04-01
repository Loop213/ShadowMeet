import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import AdminMetrics from "../components/admin/AdminMetrics";
import AdminChatLogs from "../components/admin/AdminChatLogs";
import AdminReports from "../components/admin/AdminReports";
import AdminUsersTable from "../components/admin/AdminUsersTable";
import { api } from "../services/api";

function AdminPage() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [chatLogs, setChatLogs] = useState([]);
  const [reports, setReports] = useState([]);

  const loadAdminData = async () => {
    const [{ data: analyticsData }, { data: userData }, { data: logData }, { data: reportData }] =
      await Promise.all([
      api.get("/admin/analytics"),
      api.get("/admin/users"),
      api.get("/admin/chat-logs"),
      api.get("/admin/reports"),
    ]);

    setAnalytics(analyticsData.analytics);
    setUsers(userData.users);
    setChatLogs(logData.messages);
    setReports(reportData.reports);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleBan = async (user) => {
    await api.patch(`/admin/users/${user._id}/ban`, {
      isBanned: !user.isBanned,
      bannedReason: user.isBanned ? "" : "Community safety review",
    });
    loadAdminData();
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-300">Admin console</p>
          <h2 className="mt-1 text-3xl font-semibold text-white">Privacy-governed oversight</h2>
          <p className="mt-2 text-sm text-slate-400">
            This area exposes real emails, IP addresses, moderation data, and ban controls.
          </p>
        </div>
        <AdminMetrics analytics={analytics} />
        <AdminUsersTable users={users} onToggleBan={handleToggleBan} />
        <AdminReports reports={reports} />
        <AdminChatLogs messages={chatLogs} />
      </div>
    </AppShell>
  );
}

export default AdminPage;
