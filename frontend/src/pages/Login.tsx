import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-900 to-brand-700 text-white shadow-md">
            <ShieldCheck className="h-8 w-8 text-brand-300" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Sign in to RawTrace
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Blockchain-Based Responsible Raw Material Traceability System
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <span className="text-xs text-slate-500">Need an account? </span>
            <Link to="/register" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
              Register here
            </Link>
          </div>
        </div>

        {/* Quick Demo Credentials */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="text-xs font-bold text-emerald-950 mb-2">
            Quick Demo Accounts (Click to Fill):
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@traceability.org", "Admin@12345")}
              className="text-left rounded-lg bg-white p-2 border border-emerald-200 hover:bg-emerald-100 transition"
            >
              <div className="font-bold text-purple-700">Administrator</div>
              <div className="text-slate-500 text-[10px]">admin@traceability.org</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("supplier@atacama-lithium.com", "Supplier@12345")}
              className="text-left rounded-lg bg-white p-2 border border-emerald-200 hover:bg-emerald-100 transition"
            >
              <div className="font-bold text-emerald-700">Approved Supplier</div>
              <div className="text-slate-500 text-[10px]">supplier@atacama-lithium.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("mfg@nexusev-battery.com", "Mfg@12345")}
              className="text-left rounded-lg bg-white p-2 border border-emerald-200 hover:bg-emerald-100 transition"
            >
              <div className="font-bold text-sky-700">Manufacturer</div>
              <div className="text-slate-500 text-[10px]">mfg@nexusev-battery.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("auditor@sgs-sustainability.org", "Auditor@12345")}
              className="text-left rounded-lg bg-white p-2 border border-emerald-200 hover:bg-emerald-100 transition"
            >
              <div className="font-bold text-amber-700">Auditor</div>
              <div className="text-slate-500 text-[10px]">auditor@sgs-sustainability.org</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
