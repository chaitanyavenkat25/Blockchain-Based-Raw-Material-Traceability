import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, X, RefreshCw } from "lucide-react";
import { api } from "../api/client";

interface TamperModalProps {
  batchId: string;
  isOpen: boolean;
  onClose: () => void;
  onTampered: () => void;
}

export const TamperModal: React.FC<TamperModalProps> = ({
  batchId,
  isOpen,
  onClose,
  onTampered,
}) => {
  const [field, setField] = useState("quantity");
  const [tamperedValue, setTamperedValue] = useState("99999");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateTamper = async () => {
    setIsSubmitting(true);
    setResultMessage(null);
    try {
      const res = await api.post(`/batches/${batchId}/simulate-tamper`, {
        field,
        tamperedValue: field === "quantity" ? Number(tamperedValue) : tamperedValue,
      });
      setResultMessage(res.data.message);
      onTampered();
    } catch (err: any) {
      setResultMessage(err.response?.data?.message || "Failed to simulate tampering");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-amber-600 font-bold text-base">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span>Academic Demonstration: Off-Chain Tamper Simulation</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-5 space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            In a traditional database without blockchain verification, an attacker or compromised database administrator could silently edit records (e.g. inflating material quantity or changing origin).
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-amber-900">
            <strong>How this experiment works:</strong>
            <ol className="list-decimal list-inside mt-1.5 space-y-1 text-[11px] text-amber-800">
              <li>This test will alter the chosen field in MongoDB directly.</li>
              <li>The stored cryptographic hash and blockchain contract remain untouched.</li>
              <li>When you re-run <strong>Cryptographic Audit</strong>, the system will re-serialize the record, discover the hash mismatch, and sound an alert!</li>
            </ol>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Field to Tamper In Database
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                <option value="quantity">quantity (e.g., change to 99,999)</option>
                <option value="organization">organization (change company name)</option>
                <option value="notes">notes (change inspection notes)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tampered Value
              </label>
              <input
                type="text"
                value={tamperedValue}
                onChange={(e) => setTamperedValue(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {resultMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 text-xs">
              {resultMessage}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSimulateTamper}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 shadow-sm transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            Simulate Tampering Now
          </button>
        </div>
      </div>
    </div>
  );
};
