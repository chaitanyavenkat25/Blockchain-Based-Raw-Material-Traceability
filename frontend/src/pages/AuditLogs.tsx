import React, { useEffect, useState } from "react";
import { History, ShieldAlert, AlertTriangle, Filter, Search } from "lucide-react";
import { api } from "../api/client";
import { Badge } from "../components/Badge";

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [tamperOnly, setTamperOnly] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (severityFilter !== "ALL") params.severity = severityFilter;
      if (tamperOnly) params.isTamperAlert = "true";

      const res = await api.get("/audit-logs", { params });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [severityFilter, tamperOnly]);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return <Badge variant="danger">CRITICAL</Badge>;
      case "WARNING":
        return <Badge variant="warning">WARNING</Badge>;
      default:
        return <Badge variant="neutral">INFO</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="h-6 w-6 text-brand-700" />
            System Audit & Security Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable tracking of privileged operations, tamper alerts, supplier approvals, and on-chain events
          </p>
        </div>

        <button
          onClick={() => setTamperOnly(!tamperOnly)}
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
            tamperOnly
              ? "bg-rose-50 border-rose-300 text-rose-700 shadow-xs"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-rose-600" />
          <span>{tamperOnly ? "Showing Tamper Alerts Only" : "Filter Tamper Alerts"}</span>
        </button>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        {["ALL", "INFO", "WARNING", "CRITICAL"].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`rounded-xl px-3.5 py-1.5 font-semibold transition ${
              severityFilter === sev
                ? "bg-brand-700 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No audit records matching the specified criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold">Actor / Organization</th>
                  <th className="py-3 px-4 font-semibold">Target</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className={log.isTamperAlert ? "bg-rose-50/40" : "hover:bg-slate-50/80 transition"}>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      {getSeverityBadge(log.severity)}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{log.actorEmail || "System Engine"}</div>
                      <div className="text-[10px] text-slate-400">{log.actorRole}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-semibold text-slate-800">{log.targetResource}:</span> {log.targetId}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <pre className="max-w-xs overflow-x-auto rounded-lg bg-slate-100 p-1.5 text-[10px] font-mono text-slate-700">
                        {JSON.stringify(log.details, null, 1)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
