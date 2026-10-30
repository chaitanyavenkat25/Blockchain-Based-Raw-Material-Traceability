import React, { useEffect, useState } from "react";
import {
  FileCheck2,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  Send,
} from "lucide-react";
import { api } from "../api/client";
import { Certificate } from "../types";
import { Badge } from "../components/Badge";
import { useAuth } from "../context/AuthContext";

export const Certificates: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [reviewModalCert, setReviewModalCert] = useState<Certificate | null>(null);

  // Upload Form
  const [uploadForm, setUploadForm] = useState({
    batchId: "",
    certificateType: "ISO_14001",
    certificateName: "",
    certificateNumber: "",
    issuer: "",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
    scope: "Environmental management & supply chain audit",
    environmental: true,
    laborHumanRights: true,
    conflictFree: false,
    recycledRenewable: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review Form
  const [reviewForm, setReviewForm] = useState({
    status: "VERIFIED",
    reviewerNotes: "Verified against standard authority registry.",
  });
  const [isReviewing, setIsReviewing] = useState(false);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedStatus !== "ALL") params.status = selectedStatus;
      const res = await api.get("/certificates", { params });
      if (res.data.success) {
        setCertificates(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [selectedStatus]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a certificate document file");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("batchId", uploadForm.batchId);
      formData.append("certificateType", uploadForm.certificateType);
      formData.append("certificateName", uploadForm.certificateName);
      formData.append("certificateNumber", uploadForm.certificateNumber);
      formData.append("issuer", uploadForm.issuer);
      formData.append("issueDate", uploadForm.issueDate);
      formData.append("expiryDate", uploadForm.expiryDate);
      formData.append("scope", uploadForm.scope);
      formData.append("environmental", String(uploadForm.environmental));
      formData.append("laborHumanRights", String(uploadForm.laborHumanRights));
      formData.append("conflictFree", String(uploadForm.conflictFree));
      formData.append("recycledRenewable", String(uploadForm.recycledRenewable));

      await api.post("/certificates", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadModalOpen(false);
      setFile(null);
      await fetchCertificates();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit certificate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalCert) return;
    setIsReviewing(true);
    try {
      await api.patch(`/certificates/${reviewModalCert._id}/review`, reviewForm);
      setReviewModalCert(null);
      await fetchCertificates();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update review");
    } finally {
      setIsReviewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge variant="success">Verified by Auditor</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Rejected</Badge>;
      case "DISPUTED":
        return <Badge variant="danger">Disputed Claim</Badge>;
      case "SUBMITTED":
        return <Badge variant="warning">Submitted (Unverified)</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="h-6 w-6 text-brand-700" />
            Responsible Sourcing Certificates
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Independent environmental, labor, and conflict-free compliance claims with cryptographic document hashes
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-800 shadow-sm transition w-fit"
        >
          <Upload className="h-4 w-4" />
          Submit Certificate Evidence
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        {["ALL", "SUBMITTED", "VERIFIED", "REJECTED", "DISPUTED"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`rounded-xl px-3.5 py-1.5 font-semibold transition ${
              selectedStatus === st
                ? "bg-brand-700 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Certificates Cards */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
        </div>
      ) : certificates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileCheck2 className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-2 text-sm font-bold text-slate-900">No Certificates Found</h3>
          <p className="mt-1 text-xs text-slate-500">
            Submit a new certification document to establish independent evidence.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                    {cert.batchId}
                  </span>
                  {getStatusBadge(cert.status)}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {cert.certificateName}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Issuer: <span className="font-semibold text-slate-700">{cert.issuer}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Standard: {cert.certificateType} • #{cert.certificateNumber}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Issue Date:</span>
                    <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expires:</span>
                    <span>{new Date(cert.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="font-mono text-[10px] text-slate-500 break-all p-2 rounded-lg bg-slate-100/70 border border-slate-200">
                  <span className="font-bold text-slate-700 block">Document SHA-256:</span>
                  {cert.documentHash}
                </div>

                {cert.reviewerNotes && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-900">
                    <span className="font-bold block text-[11px]">Auditor Notes:</span>
                    {cert.reviewerNotes}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 truncate">
                  By {cert.submittedByName}
                </span>

                {(user?.role === "ADMIN" || user?.role === "AUDITOR") && (
                  <button
                    onClick={() => {
                      setReviewModalCert(cert);
                      setReviewForm({
                        status: cert.status === "SUBMITTED" ? "VERIFIED" : cert.status,
                        reviewerNotes: cert.reviewerNotes || "",
                      });
                    }}
                    className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                  >
                    Review Claim
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Certificate Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Submit Sourcing & Compliance Evidence
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload PDF or image certificates. System will calculate document SHA-256 for on-chain anchoring.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch ID</label>
                  <input
                    type="text"
                    required
                    value={uploadForm.batchId}
                    onChange={(e) => setUploadForm({ ...uploadForm, batchId: e.target.value })}
                    placeholder="BATCH-LITH-2026-001"
                    className="w-full rounded-xl border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Certificate Standard</label>
                  <select
                    value={uploadForm.certificateType}
                    onChange={(e) => setUploadForm({ ...uploadForm, certificateType: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white"
                  >
                    <option value="ISO_14001">ISO 14001 Environmental</option>
                    <option value="IRMA">IRMA Responsible Mining</option>
                    <option value="FAIRTRADE">Fairtrade Certified</option>
                    <option value="ASI">ASI Aluminum Stewardship</option>
                    <option value="CONFLICT_FREE">OECD / RMI Conflict-Free</option>
                    <option value="ORGANIC">GOTS / USDA Organic</option>
                    <option value="CUSTOM">Custom Sourcing Standard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Certificate Title</label>
                <input
                  type="text"
                  required
                  value={uploadForm.certificateName}
                  onChange={(e) => setUploadForm({ ...uploadForm, certificateName: e.target.value })}
                  placeholder="e.g. IRMA Achievement 50 Certificate"
                  className="w-full rounded-xl border border-slate-300 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Certificate Number</label>
                  <input
                    type="text"
                    required
                    value={uploadForm.certificateNumber}
                    onChange={(e) => setUploadForm({ ...uploadForm, certificateNumber: e.target.value })}
                    placeholder="e.g. IRMA-2026-092"
                    className="w-full rounded-xl border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Accredited Issuer</label>
                  <input
                    type="text"
                    required
                    value={uploadForm.issuer}
                    onChange={(e) => setUploadForm({ ...uploadForm, issuer: e.target.value })}
                    placeholder="e.g. SGS / IRMA / OneCert"
                    className="w-full rounded-xl border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document File (PDF, PNG, JPG)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 shadow-sm transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Uploading..." : "Submit for Audit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Certificate Modal */}
      {reviewModalCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Auditor Certificate Review Desk
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Reviewing '{reviewModalCert.certificateName}' for Batch {reviewModalCert.batchId}.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Review Decision</label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white"
                >
                  <option value="VERIFIED">VERIFIED (Anchors hash to blockchain)</option>
                  <option value="REJECTED">REJECTED (Documentation invalid)</option>
                  <option value="DISPUTED">DISPUTED (Formal inquiry required)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Auditor Review Notes</label>
                <textarea
                  rows={3}
                  required
                  value={reviewForm.reviewerNotes}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewerNotes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalCert(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReviewing}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 shadow-sm transition disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isReviewing ? "Saving..." : "Confirm Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
