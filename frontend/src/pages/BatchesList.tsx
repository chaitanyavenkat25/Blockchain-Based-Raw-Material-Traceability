import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  Search,
  PlusCircle,
  QrCode,
  GitFork,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { api } from "../api/client";
import { Batch } from "../types";
import { Badge } from "../components/Badge";
import { QRModal } from "../components/QRModal";
import { useAuth } from "../context/AuthContext";

export const BatchesList: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedBatchForQR, setSelectedBatchForQR] = useState<Batch | null>(null);

  const categories = ["ALL", "Mineral", "Metal", "Fiber", "Agriculture", "Recycled"];

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== "ALL") params.category = selectedCategory;
      if (selectedStatus !== "ALL") params.status = selectedStatus;
      if (search) params.search = search;

      const res = await api.get("/batches", { params });
      if (res.data.success) {
        setBatches(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBatches();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return "info";
      case "IN_TRANSIT":
        return "warning";
      case "PROCESSING":
        return "purple";
      case "MANUFACTURED":
        return "success";
      case "SPLIT":
      case "MERGED":
        return "neutral";
      case "FLAGGED":
        return "danger";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Boxes className="h-6 w-6 text-brand-700" />
            Raw Material Batches
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered material batches with cryptographic hash chains and blockchain anchors
          </p>
        </div>

        {(user?.role === "SUPPLIER" || user?.role === "ADMIN") && (
          <Link
            to="/batches/new"
            className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-800 transition shadow-sm w-fit"
          >
            <PlusCircle className="h-4 w-4" />
            Register New Batch
          </Link>
        )}
      </div>

      {/* Filters & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Batch ID, Material, Supplier, or Country..."
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="h-3.5 w-3.5" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1 font-semibold transition shrink-0 ${
                selectedCategory === cat
                  ? "bg-brand-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Batches Table / Cards */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
        </div>
      ) : batches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Boxes className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-2 text-sm font-bold text-slate-900">No Batches Found</h3>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search filters or register a new raw material batch.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map((batch) => (
            <div
              key={batch._id}
              className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                batch.isFlagged ? "border-rose-300 bg-rose-50/20" : "border-slate-200"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {batch.materialCategory}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {batch.materialName}
                    </h3>
                  </div>
                  <Badge variant={getStatusBadgeVariant(batch.status)} size="sm">
                    {batch.status}
                  </Badge>
                </div>

                <div className="font-mono text-xs font-semibold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg w-fit border border-brand-200">
                  {batch.batchId}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Quantity:</span>
                    <span className="font-bold text-slate-800">
                      {batch.quantity.toLocaleString()} {batch.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Origin:</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {batch.countryOfOrigin}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Supplier:</span> {batch.supplierName}
                </div>

                {batch.isFlagged && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-rose-100/70 p-2 text-[11px] font-semibold text-rose-800">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                    <span className="truncate">{batch.flagReason || "Under audit inquiry"}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedBatchForQR(batch)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-brand-700 transition"
                    title="View QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>

                  <Link
                    to={`/genealogy/${batch.batchId}`}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-brand-700 transition"
                    title="View Genealogy Family Tree"
                  >
                    <GitFork className="h-4 w-4" />
                  </Link>
                </div>

                <Link
                  to={`/batches/${batch.batchId}`}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-50 border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-800 hover:bg-brand-100 transition"
                >
                  <span>Trace Journey</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBatchForQR && (
        <QRModal
          batch={selectedBatchForQR}
          isOpen={!!selectedBatchForQR}
          onClose={() => setSelectedBatchForQR(null)}
        />
      )}
    </div>
  );
};
