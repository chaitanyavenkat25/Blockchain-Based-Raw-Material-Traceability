import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  PlusCircle,
  FileCheck2,
  QrCode,
  Building2,
  ShieldAlert,
  Blocks,
  History,
  UserCog,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const navItems = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      visible: true,
    },
    {
      to: "/batches",
      icon: Boxes,
      label: "Material Batches",
      visible: true,
    },
    {
      to: "/batches/new",
      icon: PlusCircle,
      label: "Register Batch",
      visible: role === "SUPPLIER" || role === "ADMIN",
    },
    {
      to: "/certificates",
      icon: FileCheck2,
      label: "Certificates",
      visible: true,
    },
    {
      to: "/qr-scanner",
      icon: QrCode,
      label: "QR Scanner",
      visible: true,
    },
    {
      to: "/suppliers",
      icon: Building2,
      label: "Suppliers",
      visible: role === "ADMIN" || role === "AUDITOR" || role === "MANUFACTURER",
    },
    {
      to: "/auditor",
      icon: ShieldAlert,
      label: "Auditor Inspection",
      visible: role === "AUDITOR" || role === "ADMIN",
    },
    {
      to: "/blockchain",
      icon: Blocks,
      label: "Blockchain Ledger",
      visible: true,
    },
    {
      to: "/audit-logs",
      icon: History,
      label: "System Audit Logs",
      visible: role === "ADMIN" || role === "AUDITOR",
    },
    {
      to: "/profile",
      icon: UserCog,
      label: "Profile & Settings",
      visible: true,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems
              .filter((item) => item.visible)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? "bg-brand-50 text-brand-900 font-bold border border-brand-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 text-brand-700" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
          </nav>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Blockchain Verified
          </div>
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            All registered supply chain events are canonically hashed and anchored into local EVM smart contracts.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-600">
        <div>Connected Node: <span className="font-mono text-slate-600">EVM:31337</span></div>
        <div className="mt-0.5">Academic Project v1.0</div>
      </div>
    </aside>
  );
};
