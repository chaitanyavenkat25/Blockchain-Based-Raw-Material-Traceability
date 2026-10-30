import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  Boxes,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { api } from "../api/client";
import { Batch } from "../types";
import { Badge } from "../components/Badge";

export const AuditorView: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [flagModalBatch, setFlagModalBatch] = useState<Batch | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [severity, setSeverity] = useState<"WARNING" | "CRITICAL">("WARNING");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get("/batches");
      if (res.data.success) {
        setBatches(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load batches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagModalBatch) return;
    setIsSubmitting(true);
    try {
      await api.post(`/audit-logs/flags/${flagModalBatch.batchId}`, {
        reason: flagReason,
        severity,
      });
      setFlagModalBatch(null);
      setFlagReason("");
      await fetchBatches();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to flag batch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-600" />
            Auditor Sourcing Inspection Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Independent review of environmental, human rights, and provenance claims across supply chains
          </p>
        </div>

        <Link
          to="/audit-logs"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs w-fit"
        >
          View System Audit Logs
        </Link>
      </div>

      {/* Auditor Notice Banner */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-amber-950 text-xs leading-relaxed space-y-1">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Auditor Core Responsibility & Ethics
        </div>
        <p>
          As an accredited auditor, you verify whether supplier-submitted declarations match physical site reality and documentary proof. When you flag a record or certify a batch, your findings are appended to the historical blockchain ledger without altering previous events.
        </p>
      </div>

      {/* Batches Audit Inspection Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Registered Batches under Surveillance</h2>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">Batch ID</th>
                  <th className="py-3 px-4 font-semibold">Material</th>
                  <th className="py-3 px-4 font-semibold">Origin</th>
                  <th className="py-3 px-4 font-semibold">Supplier</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-brand-800">
                      {b.batchId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {b.materialName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.countryOfOrigin}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.supplierName}
                    </td>
                    <td className="py-3 px-4">
                      {b.isFlagged ? (
                        <Badge variant="danger" size="sm">Flagged Inquiry</Badge>
                      ) : (
                        <Badge variant="success" size="sm">{b.status}</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/batches/${b.batchId}`}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 transition font-medium"
                        >
                          Inspect Timeline
                        </Link>
                        {!b.isFlagged && (
                          <button
                            onClick={() => {
                              setFlagModalBatch(b);
                              setFlagReason("Discrepancy in documentation or physical inspection.");
                            }}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700 hover:bg-rose-100 transition font-medium"
                          >
                            Flag Record
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Flag Modal */}
      {flagModalBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Flag Suspicious Record
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Flagging batch {flagModalBatch.batchId} will record an immutable append-only AUDIT_FLAG event into the blockchain history.
            </p>

            <form onSubmit={handleFlagSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white"
                >
                  <option value="WARNING">WARNING (Documentation inquiry)</option>
                  <option value="CRITICAL">CRITICAL (Proven violation or fraud suspicion)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Auditor Reason & Findings</label>
                <textarea
                  rows={3}
                  required
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="State the observed discrepancy, missing permit, or assay mismatch."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFlagModalBatch(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
                >
                  <ShieldAlert className="h-4 w-4" />
                  {isSubmitting ? "Flagging..." : "Confirm Flag on Chain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
