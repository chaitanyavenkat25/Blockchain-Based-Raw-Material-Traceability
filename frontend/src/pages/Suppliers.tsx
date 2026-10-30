import React, { useEffect, useState } from "react";
import { Building2, CheckCircle2, XCircle, Search, AlertCircle, ShieldCheck } from "lucide-react";
import { api } from "../api/client";
import { SupplierProfile } from "../types";
import { Badge } from "../components/Badge";
import { useAuth } from "../context/AuthContext";

export const Suppliers: React.FC = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [reviewModalSupplier, setReviewModalSupplier] = useState<SupplierProfile | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("Third-party compliance verified.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedStatus !== "ALL") params.status = selectedStatus;
      if (search) params.search = search;
      const res = await api.get("/suppliers", { params });
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [selectedStatus]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalSupplier) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/suppliers/${reviewModalSupplier._id}/status`, {
        status: decision,
        reviewNotes,
      });
      setReviewModalSupplier(null);
      await fetchSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update supplier status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success">Accredited</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Rejected</Badge>;
      case "PENDING_APPROVAL":
        return <Badge variant="warning">Pending Review</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-brand-700" />
          Raw Material Supplier Directory
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Accredited extraction facilities, agricultural cooperatives, and recycling centers
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        {["ALL", "PENDING_APPROVAL", "APPROVED", "REJECTED"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`rounded-xl px-3.5 py-1.5 font-semibold transition ${
              selectedStatus === st
                ? "bg-brand-700 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {st.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Suppliers Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-2 text-sm font-bold text-slate-900">No Suppliers Found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((supp) => (
            <div
              key={supp._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {supp.companyName}
                  </h3>
                  {getStatusBadge(supp.complianceStatus)}
                </div>

                <div className="text-xs text-slate-500">
                  Reg #: <span className="font-mono text-slate-700">{supp.registrationNumber}</span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Location:</span>
                    <span className="font-semibold text-slate-800">{supp.region}, {supp.country}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Facility Type:</span>
                    <span className="font-semibold text-slate-800">{supp.facilityType}</span>
                  </div>
                </div>

                {supp.reviewNotes && (
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] text-slate-600">
                    <strong>Review Note:</strong> {supp.reviewNotes}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Joined {new Date(supp.createdAt).toLocaleDateString()}
                </span>

                {user?.role === "ADMIN" && (
                  <button
                    onClick={() => {
                      setReviewModalSupplier(supp);
                      setDecision(supp.complianceStatus === "PENDING_APPROVAL" ? "APPROVED" : supp.complianceStatus as any);
                      setReviewNotes(supp.reviewNotes || "Accreditation approved.");
                    }}
                    className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                  >
                    Manage Status
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Supplier Modal */}
      {reviewModalSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Supplier Accreditation Review
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Review compliance credentials for {reviewModalSupplier.companyName}.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Decision</label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white"
                >
                  <option value="APPROVED">APPROVED (Authorized to register batches)</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Review Notes</label>
                <textarea
                  rows={3}
                  required
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalSupplier(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 shadow-sm transition disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSubmitting ? "Updating..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
