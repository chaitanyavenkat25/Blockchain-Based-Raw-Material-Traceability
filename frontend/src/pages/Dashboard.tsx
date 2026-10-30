import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck,
  Blocks,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { DashboardAnalytics } from "../types";
import { Badge } from "../components/Badge";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/analytics/dashboard");
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
          Loading dashboard metrics...
        </div>
      </div>
    );
  }

  const overview = data?.overview || {
    totalBatches: 0,
    inTransitBatches: 0,
    manufacturedBatches: 0,
    flaggedBatches: 0,
    pendingSuppliers: 0,
    pendingCertificates: 0,
    verifiedCertificates: 0,
  };

  const COLORS = ["#15803d", "#0284c7", "#eab308", "#8b5cf6", "#ec4899"];

  const claimsPieData = [
    { name: "Verified Claims", value: data?.claimsBreakdown.verifiedCertificates || 0, color: "#15803d" },
    { name: "Pending / Self-Declared", value: data?.claimsBreakdown.unverifiedOrPending || 0, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-950 via-brand-900 to-slate-900 p-6 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-brand-300 border border-brand-400/30">
              Role: {user?.role}
            </span>
            {user?.status === "PENDING_APPROVAL" && (
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-400/30">
                Awaiting Admin Approval
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-bold mt-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {user?.organization} • Immutable provenance records anchored on local EVM smart contract <code className="text-brand-300 font-mono">RawMaterialTraceability</code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(user?.role === "SUPPLIER" || user?.role === "ADMIN") && (
            <Link
              to="/batches/new"
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-500 shadow-sm transition"
            >
              <Boxes className="h-4 w-4" />
              Register Batch
            </Link>
          )}
          <Link
            to="/batches"
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition border border-white/20"
          >
            View Batches
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Batches</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{overview.totalBatches}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all material categories</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">In Transit</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{overview.inTransitBatches}</div>
          <div className="text-[11px] text-slate-500 mt-1">Moving between supply chain actors</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Verified Certificates</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{overview.verifiedCertificates}</div>
          <div className="text-[11px] text-slate-500 mt-1">{overview.pendingCertificates} pending review</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Flagged Inquiries</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{overview.flaggedBatches}</div>
          <div className="text-[11px] text-slate-500 mt-1">Suspicious or incomplete records</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Material Category Distribution */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Material Category Volume</h3>
              <p className="text-xs text-slate-500">Live distribution of registered raw materials</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.categoryDistribution || []}>
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#15803d" radius={[6, 6, 0, 0]} name="Batches Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sourcing Claims Verification Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sourcing Verification Status</h3>
            <p className="text-xs text-slate-500">Verified by accredited audit vs self-declared</p>
          </div>
          <div className="h-52 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={claimsPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {claimsPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 mt-2 border border-slate-100">
            <strong>System Safeguard:</strong> Self-declarations are never automatically labeled verified without independent accredited audit evidence.
          </div>
        </div>
      </div>

      {/* Role-Specific Shortcuts & Blockchain Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Blockchain Status Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Blocks className="h-5 w-5 text-brand-700" />
              <h3 className="text-xs font-bold text-slate-900">Blockchain Ledger Node</h3>
            </div>
            {data?.blockchain.isAvailable ? (
              <Badge variant="success" size="sm">EVM Live</Badge>
            ) : (
              <Badge variant="warning" size="sm">Local Node Standby</Badge>
            )}
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Network:</span>
              <span className="font-semibold text-slate-800">Hardhat Local (EVM 31337)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Confirmed Events:</span>
              <span className="font-semibold text-emerald-700">{data?.blockchain.confirmedEvents}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Smart Contract:</span>
              <span className="font-mono text-[10px] text-slate-600 truncate max-w-[150px]">
                RawMaterialTraceability
              </span>
            </div>
          </div>
          <Link
            to="/blockchain"
            className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <span>Explore Blockchain Transactions</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Quick Actions Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-700" />
            <h3 className="text-xs font-bold text-slate-900">Quick Workflow Tools</h3>
          </div>
          <div className="space-y-2">
            <Link
              to="/qr-scanner"
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-brand-50 hover:border-brand-200 transition text-xs font-semibold text-slate-800"
            >
              <span>Scan Material QR Code</span>
              <ArrowRight className="h-4 w-4 text-brand-700" />
            </Link>
            <Link
              to="/certificates"
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-brand-50 hover:border-brand-200 transition text-xs font-semibold text-slate-800"
            >
              <span>Manage Sustainability Certs</span>
              <ArrowRight className="h-4 w-4 text-brand-700" />
            </Link>
            {(user?.role === "ADMIN" || user?.role === "AUDITOR") && (
              <Link
                to="/auditor"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-brand-50 hover:border-brand-200 transition text-xs font-semibold text-slate-800"
              >
                <span>Auditor Inspection Desk</span>
                <ArrowRight className="h-4 w-4 text-brand-700" />
              </Link>
            )}
          </div>
        </div>

        {/* Recent Activity Mini-Feed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-700" />
            <h3 className="text-xs font-bold text-slate-900">Recent Supply Chain Events</h3>
          </div>
          <div className="space-y-2.5">
            {data?.recentActivity?.slice(0, 4).map((evt) => (
              <div key={evt._id} className="text-xs flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-600 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 truncate">
                    {evt.eventType.replace(/_/g, " ")} • {evt.batchId}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {evt.organization} • {new Date(evt.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
