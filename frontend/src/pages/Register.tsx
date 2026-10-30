import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "SUPPLIER" as UserRole,
    organization: "",
    ethereumAddress: "",
    phone: "",
    // Supplier specific
    companyName: "",
    registrationNumber: "",
    country: "",
    region: "",
    facilityType: "Solar Brine Extraction",
    sourcingCategories: "Mineral, Lithium",
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        organization: formData.organization,
        ethereumAddress: formData.ethereumAddress || undefined,
        phone: formData.phone || undefined,
      };

      if (formData.role === "SUPPLIER") {
        payload.supplierProfile = {
          companyName: formData.companyName || formData.organization,
          registrationNumber: formData.registrationNumber,
          country: formData.country,
          region: formData.region,
          facilityType: formData.facilityType,
          sourcingCategories: formData.sourcingCategories.split(",").map((s) => s.trim()),
        };
      }

      await register(payload);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-10 px-4">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-900 to-brand-700 text-white shadow-md">
            <ShieldCheck className="h-8 w-8 text-brand-300" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Create an Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Join the decentralized responsible raw material traceability registry
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. John Doe"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@organization.com"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (min 6 chars, uppercase & number)
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  System Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="SUPPLIER">Raw Material Supplier (Extraction/Mining)</option>
                  <option value="MANUFACTURER">Manufacturer (Downstream Processing)</option>
                  <option value="AUDITOR">Auditor (Accredited Certification Reviewer)</option>
                  <option value="CONSUMER">Public Consumer</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Nordic Minerals AB"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ethereum Public Address (Optional)
                </label>
                <input
                  type="text"
                  value={formData.ethereumAddress}
                  onChange={(e) => setFormData({ ...formData, ethereumAddress: e.target.value })}
                  placeholder="0x..."
                  className="w-full rounded-xl border border-slate-300 font-mono px-3.5 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Supplier Profile Fields */}
            {formData.role === "SUPPLIER" && (
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 space-y-3">
                <div className="text-xs font-bold text-brand-900">
                  Supplier Accreditation Details (Admin Approval Required)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Business Registration #
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      placeholder="e.g. REG-2026-9021"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Country of Operation
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g. Chile"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Region / Province
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      placeholder="e.g. Salar de Atacama"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Facility / Extraction Type
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.facilityType}
                      onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                      placeholder="e.g. Direct Brine Extraction"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "Creating Account..." : "Complete Registration"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <span className="text-xs text-slate-500">Already have an account? </span>
            <Link to="/login" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
