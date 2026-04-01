function AdminMetrics({ analytics }) {
  const cards = [
    { label: "Total users", value: analytics?.totalUsers || 0 },
    { label: "Active users", value: analytics?.activeUsers || 0 },
    { label: "Messages", value: analytics?.totalMessages || 0 },
    { label: "Flagged", value: analytics?.flaggedMessages || 0 },
    { label: "Calls", value: analytics?.totalCalls || 0 },
    { label: "Live sessions", value: analytics?.activeSessions || 0 },
    { label: "Reports open", value: analytics?.reportsOpen || 0 },
    { label: "Matches/min", value: analytics?.matchesPerMinute || 0 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
      {cards.map((card) => (
        <div key={card.label} className="glass-panel rounded-3xl p-5">
          <p className="text-sm text-slate-400">{card.label}</p>
          <p className="mt-3 text-3xl font-bold text-white">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

export default AdminMetrics;
