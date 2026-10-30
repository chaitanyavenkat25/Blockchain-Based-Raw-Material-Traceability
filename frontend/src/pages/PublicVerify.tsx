import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Building,
  FileCheck,
  ExternalLink,
  Blocks,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { api } from "../api/client";
import { Badge } from "../components/Badge";

export const PublicVerify: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/public/batches/${batchId}`);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Batch not found in public traceability registry.");
      } finally {
        setLoading(false);
      }
    };

    if (batchId) {
      fetchPublicData();
    }
  }, [batchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
          Verifying public cryptographic records...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-sm text-center space-y-3">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-600" />
          <h2 className="text-base font-bold text-slate-900">Batch Record Not Found</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <Link
            to="/qr-scanner"
            className="inline-block rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition mt-2"
          >
            Scan Another Code
          </Link>
        </div>
      </div>
    );
  }

  const { batch, supplier, timeline, certificates, integrity, warnings, disclaimer } = data;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-900 text-white shadow-sm">
              <ShieldCheck className="h-6 w-6 text-brand-300" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900">
                RawTrace <span className="text-brand-700">Public Verification</span>
              </span>
              <span className="block text-[11px] text-slate-500">
                Independent Supply Chain Provenance Record
              </span>
            </div>
          </div>

          <Link
            to="/login"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            Enterprise Login
          </Link>
        </div>

        {/* Warnings & Inquiries Banner */}
        {warnings && warnings.length > 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 space-y-2 text-xs text-amber-950">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Consumer Sourcing Advisories:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
              {warnings.map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Batch Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {batch.materialCategory}
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5">
                {batch.materialName}
              </h1>
              <div className="font-mono text-xs font-semibold text-brand-800 mt-1">
                Batch ID: {batch.batchId}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={supplier.accreditationStatus === "APPROVED" ? "success" : "warning"}>
                Supplier: {supplier.accreditationStatus}
              </Badge>
              {integrity?.overallStatus === "INTACT" ? (
                <Badge variant="success">Cryptographically Valid</Badge>
              ) : (
                <Badge variant="danger">Discrepancy Detected</Badge>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
            {batch.description}
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-100 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Batch Volume</span>
              <span className="text-base font-bold text-slate-900">
                {batch.quantity.toLocaleString()} {batch.unit}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Origin Location</span>
              <span className="text-base font-bold text-slate-900">
                {batch.countryOfOrigin}
              </span>
              <span className="text-[11px] text-slate-500 block truncate">{batch.regionOfOrigin}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Extraction Date</span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                {new Date(batch.extractionDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Blockchain Proof</span>
              <span className="text-xs font-bold text-emerald-700 block mt-0.5">
                {batch.blockchainStatus === "CONFIRMED" ? "Anchored on EVM" : "Recorded"}
              </span>
            </div>
          </div>

          {/* Sourcing Claims Badges */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Responsible Sourcing Status
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold ${
                  batch.sourcingDeclarations?.environmentalCompliance
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                Environmental Compliance: {batch.sourcingDeclarations?.environmentalCompliance ? "Yes" : "No"}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold ${
                  batch.sourcingDeclarations?.laborRightsCompliant
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                Fair Labor & Human Rights: {batch.sourcingDeclarations?.laborRightsCompliant ? "Yes" : "No"}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold ${
                  batch.sourcingDeclarations?.conflictFreeDeclared
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                Conflict-Free: {batch.sourcingDeclarations?.conflictFreeDeclared ? "Declared" : "No"}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold ${
                  batch.sourcingDeclarations?.recycledOrRenewable
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                Recycled / Circular: {batch.sourcingDeclarations?.recycledOrRenewable ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        {/* Public Supply Chain Journey Timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-700" />
              Verified Supply Chain Journey Timeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Append-only audit trail verified against cryptographic hash signatures
            </p>
          </div>

          <div className="relative border-l-2 border-brand-200 pl-6 space-y-6 ml-3">
            {timeline?.map((evt: any) => (
              <div key={evt.eventId} className="relative">
                <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-700 ring-4 ring-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 text-sm">
                      {evt.eventType.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{evt.organization}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{evt.location?.name} ({evt.location?.country || batch.countryOfOrigin})</span>
                    </div>
                  </div>

                  {evt.notes && (
                    <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 text-[11px]">
                      {evt.notes}
                    </p>
                  )}

                  <div className="font-mono text-[10px] text-slate-400 break-all pt-1">
                    SHA-256: {evt.eventHash}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Certificates */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-brand-700" />
            Accredited Sourcing Certificates ({certificates?.length || 0})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {certificates?.map((c: any) => (
              <div key={c._id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-900">{c.certificateName}</div>
                  <Badge variant={c.status === "VERIFIED" ? "success" : "warning"} size="sm">
                    {c.status}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-500">
                  Issuer: <span className="font-semibold text-slate-700">{c.issuer}</span> • #{c.certificateNumber}
                </div>
                <div className="font-mono text-[10px] text-slate-400 break-all">
                  Hash: {c.documentHash}
                </div>
                {c.reviewerNotes && (
                  <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                    <strong>Auditor Verification:</strong> {c.reviewerNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer Card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-5 text-xs text-slate-500 leading-relaxed space-y-1">
          <div className="font-semibold text-slate-700 flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4" />
            Verification Notice & Limitations
          </div>
          <p>{disclaimer}</p>
        </div>
      </div>
    </div>
  );
};
