import React from "react";
import { UserCog, ShieldCheck, Mail, Building, Key, Wallet, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <UserCog className="h-6 w-6 text-brand-700" />
          User Profile & System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Account credentials, role permissions, and connected blockchain address
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-900 font-bold text-lg">
              {user?.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="purple">{user?.role}</Badge>
            <Badge variant={user?.status === "ACTIVE" ? "success" : "warning"}>
              {user?.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5" /> Organization
            </span>
            <div className="font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {user?.organization}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" /> Connected Ethereum Address
            </span>
            <div className="font-mono text-[11px] text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 break-all select-all">
              {user?.ethereumAddress || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"}
            </div>
          </div>
        </div>

        {/* Role Permissions Matrix */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-brand-700" />
            Active Role Permissions ({user?.role}):
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
            {user?.role === "ADMIN" && (
              <>
                <li>Full access to approve or reject raw material suppliers.</li>
                <li>System-wide analytics, smart contract auditing, and suspicious record reviews.</li>
                <li>Verify submitted sustainability certificates when authorized.</li>
              </>
            )}
            {user?.role === "SUPPLIER" && (
              <>
                <li>Register newly extracted or harvested raw material batches.</li>
                <li>Submit origin details, GPS coordinates, and sustainability certificates.</li>
                <li>Append extraction, processing, and transportation events.</li>
                <li>Transfer physical custody to downstream manufacturers.</li>
              </>
            )}
            {user?.role === "MANUFACTURER" && (
              <>
                <li>Receive incoming raw material shipments with verified digital custody.</li>
                <li>Perform and record batch splitting and merging operations.</li>
                <li>Link incoming material batches to resulting production lots.</li>
              </>
            )}
            {user?.role === "AUDITOR" && (
              <>
                <li>Inspect sourcing claims, certificate validity, and blockchain proof.</li>
                <li>Conduct independent laboratory assay and compliance reviews.</li>
                <li>Flag suspicious records without rewriting previous history.</li>
              </>
            )}
            {user?.role === "CONSUMER" && (
              <>
                <li>Scan public QR codes to trace material origin and supply chain journey.</li>
                <li>Verify that sustainability certificates have been independently certified.</li>
                <li>Observe tamper detection alerts if off-chain databases were manipulated.</li>
              </>
            )}
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
          >
            <LogOut className="h-4 w-4" />
            Sign Out of Account
          </button>
        </div>
      </div>
    </div>
  );
};
