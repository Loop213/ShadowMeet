function AdminUsersTable({ users, onToggleBan }) {
  return (
    <div className="glass-panel overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Anonymous name</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-t border-line">
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.randomUsername}</td>
                <td className="px-4 py-3">{user.lastIp || "Unknown"}</td>
                <td className="px-4 py-3">
                  {user.isBanned ? (
                    <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs text-red-300">
                      Banned
                    </span>
                  ) : (
                    <span className="rounded-full bg-teal-500/15 px-2 py-1 text-xs text-teal-300">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onToggleBan(user)}
                    className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-slate-950"
                  >
                    {user.isBanned ? "Unban" : "Ban"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsersTable;

