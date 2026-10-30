import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { GitFork, ArrowRight, ArrowDown, Split, Merge, AlertCircle, CheckCircle2, Boxes } from "lucide-react";
import { api } from "../api/client";
import { Badge } from "../components/Badge";
import { useAuth } from "../context/AuthContext";

export const GenealogyView: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Split Modal Form
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitReason, setSplitReason] = useState("Dedicated allocation for manufacturing run");
  const [childrenBatches, setChildrenBatches] = useState([
    { batchId: `${batchId || "BATCH"}-SPLIT-A`, quantity: 2000, unit: "kg", description: "Allocation Part A" },
    { batchId: `${batchId || "BATCH"}-SPLIT-B`, quantity: 3000, unit: "kg", description: "Allocation Part B" },
  ]);
  const [isSplitting, setIsSplitting] = useState(false);

  const fetchGenealogy = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const res = await api.get(`/genealogy/${batchId}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load genealogy:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenealogy();
  }, [batchId]);

  const handleSplitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    setIsSplitting(true);
    try {
      await api.post(`/batches/${batchId}/split`, {
        childBatches: childrenBatches.map((c) => ({
          batchId: c.batchId,
          quantity: Number(c.quantity),
          unit: c.unit,
          description: c.description,
        })),
        reason: splitReason,
      });
      setSplitModalOpen(false);
      await fetchGenealogy();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to split batch");
    } finally {
      setIsSplitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
          Loading genealogy tree...
        </div>
      </div>
    );
  }

  const nodes = data?.nodes || [];
  const edges = data?.edges || [];
  const operations = data?.operations || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/batches" className="hover:text-brand-700">Batches</Link>
            <span>/</span>
            <Link to={`/batches/${batchId}`} className="hover:text-brand-700 font-mono text-brand-800">{batchId}</Link>
            <span>/</span>
            <span>Genealogy</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-1">
            <GitFork className="h-6 w-6 text-brand-700" />
            Batch Genealogy & Provenance Graph
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visualizing parent-child splits, merges, and output batch lineage
          </p>
        </div>

        {(user?.role === "MANUFACTURER" || user?.role === "SUPPLIER" || user?.role === "ADMIN") && (
          <button
            onClick={() => setSplitModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-800 shadow-sm transition w-fit"
          >
            <Split className="h-4 w-4" />
            Split This Batch
          </button>
        )}
      </div>

      {/* Visual Lineage Nodes */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-6">
          Traceability Nodes Connected to <span className="font-mono text-brand-700">{batchId}</span>
        </h2>

        {nodes.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No split or merge genealogy operations recorded for this batch yet.
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {nodes.map((node: any) => (
                <div
                  key={node.id}
                  className={`rounded-2xl border p-5 shadow-xs transition ${
                    node.isCurrent
                      ? "border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {node.id}
                    </span>
                    {node.isCurrent ? (
                      <span className="rounded-full bg-brand-700 text-white text-[10px] font-bold px-2 py-0.5">
                        Current
                      </span>
                    ) : (
                      <Badge variant="neutral" size="sm">{node.status}</Badge>
                    )}
                  </div>

                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-900">{node.materialName}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">{node.materialCategory}</div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Quantity:</span>
                    <span className="font-bold text-slate-800">{node.quantity} {node.unit}</span>
                  </div>

                  <div className="mt-4">
                    <Link
                      to={`/batches/${node.id}`}
                      className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition w-full"
                    >
                      <span>View Batch</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Lineage Operations Breakdown */}
            {operations.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recorded Genealogy Transformations
                </h3>
                <div className="space-y-3">
                  {operations.map((op: any, i: number) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-brand-100 text-brand-900 font-bold flex items-center gap-1">
                          {op.operationType === "SPLIT" ? <Split className="h-4 w-4" /> : <Merge className="h-4 w-4" />}
                          <span>{op.operationType}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {op.parentBatchIds.join(", ")} → {op.childBatchIds.join(", ")}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Reason: {op.reason} • By {op.operatorName}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(op.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Split Batch Modal */}
      {splitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Split Batch {batchId}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Divide this raw material batch into certified child allocations with strict quantity conservation.
            </p>

            <form onSubmit={handleSplitSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Split Reason</label>
                <input
                  type="text"
                  required
                  value={splitReason}
                  onChange={(e) => setSplitReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2"
                />
              </div>

              <div className="space-y-3">
                <div className="font-semibold text-slate-800">Child Batches Allocation:</div>
                {childrenBatches.map((child, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Child Batch ID</label>
                        <input
                          type="text"
                          required
                          value={child.batchId}
                          onChange={(e) => {
                            const updated = [...childrenBatches];
                            updated[idx].batchId = e.target.value;
                            setChildrenBatches(updated);
                          }}
                          className="w-full rounded-lg border border-slate-300 p-1.5 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Quantity</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={child.quantity}
                          onChange={(e) => {
                            const updated = [...childrenBatches];
                            updated[idx].quantity = Number(e.target.value);
                            setChildrenBatches(updated);
                          }}
                          className="w-full rounded-lg border border-slate-300 p-1.5 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSplitModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSplitting}
                  className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 shadow-sm transition disabled:opacity-50"
                >
                  <Split className="h-4 w-4" />
                  {isSplitting ? "Splitting..." : "Confirm Batch Split"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
