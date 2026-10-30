import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, QrCode, LogOut, User as UserIcon, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Badge } from "./Badge";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "purple";
      case "SUPPLIER":
        return "success";
      case "MANUFACTURER":
        return "info";
      case "AUDITOR":
        return "warning";
      default:
        return "neutral";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-8 backdrop-blur shadow-sm">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            title="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-900 to-brand-700 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6 text-brand-300" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              RawTrace <span className="text-brand-700">Blockchain</span>
            </span>
            <span className="hidden text-xs text-slate-500 sm:block">
              Responsible Raw Material Traceability System
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/qr-scanner"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-800 transition"
        >
          <QrCode className="h-4 w-4 text-brand-700" />
          <span className="hidden sm:inline">Scan QR Code</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="hidden text-right md:block">
              <div className="text-xs font-bold text-slate-900">{user.name}</div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                  {user.role}
                </Badge>
                {user.status === "PENDING_APPROVAL" && (
                  <Badge variant="warning" size="sm">Pending Approval</Badge>
                )}
              </div>
            </div>

            <Link
              to="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-brand-100 hover:text-brand-800 transition"
              title="Profile & Settings"
            >
              <UserIcon className="h-4 w-4" />
            </Link>

            <button
              onClick={logout}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-brand-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 transition shadow-sm"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
