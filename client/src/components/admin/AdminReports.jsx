function AdminReports({ reports = [] }) {
  return (
    <div className="glass-panel rounded-3xl p-4">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-orange-300">Safety queue</p>
        <h3 className="mt-1 text-xl font-semibold text-white">User reports</h3>
      </div>
      <div className="space-y-3">
        {reports.slice(0, 8).map((report) => (
          <div key={report._id} className="rounded-2xl border border-line bg-slate-900/55 p-3">
            <p className="text-sm text-white">
              {report.reporterId?.randomUsername} reported {report.reportedUserId?.randomUsername}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Reason: {report.reason} | Status: {report.status}
            </p>
            {report.notes && <p className="mt-2 text-sm text-slate-300">{report.notes}</p>}
          </div>
        ))}
        {!reports.length && <p className="text-sm text-slate-400">No reports yet.</p>}
      </div>
    </div>
  );
}

export default AdminReports;

