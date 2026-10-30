import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Boxes,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  GitFork,
  PlusCircle,
  Clock,
  MapPin,
  Building,
  Hash,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  Send,
  AlertCircle,
} from "lucide-react";
import { api } from "../api/client";
import { Batch, TraceabilityEvent, Certificate, BatchIntegritySummary } from "../types";
import { Badge } from "../components/Badge";
import { QRModal } from "../components/QRModal";
import { TamperModal } from "../components/TamperModal";
import { useAuth } from "../context/AuthContext";

export const BatchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [events, setEvents] = useState<TraceabilityEvent[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [integrityReport, setIntegrityReport] = useState<BatchIntegritySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  // Modals
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [tamperModalOpen, setTamperModalOpen] = useState(false);
  const [addEventModalOpen, setAddEventModalOpen] = useState(false);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    eventType: "PROCESSING",
    locationName: "Regional Manufacturing Facility",
    country: "",
    notes: "",
    quantity: "",
    unit: "",
    newCustodianId: "",
  });
  const [eventSubmitting, setEventSubmitting] = useState(false);

  const fetchBatchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/batches/${id}`);
      if (res.data.success) {
        setBatch(res.data.data.batch);
        setCertificates(res.data.data.certificates);
      }

      const timelineRes = await api.get(`/batches/${id}/traceability`);
      if (timelineRes.data.success) {
        setEvents(timelineRes.data.data.events);
      }
    } catch (err) {
      console.error("Failed to load batch:", err);
    } finally {
      setLoading(false);
    }
  };

  const runIntegrityAudit = async () => {
    if (!id) return;
    setVerifying(true);
    try {
      const res = await api.get(`/batches/${id}/verify`);
      if (res.data.success) {
        setIntegrityReport(res.data.data);
      }
    } catch (err) {
      console.error("Integrity check failed:", err);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchBatchData();
  }, [id]);

  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setEventSubmitting(true);
    try {
      const payload: any = {
        eventType: newEvent.eventType,
        location: {
          name: newEvent.locationName,
          country: newEvent.country || batch?.countryOfOrigin,
        },
        notes: newEvent.notes,
      };
      if (newEvent.quantity) payload.quantity = Number(newEvent.quantity);
      if (newEvent.unit) payload.unit = newEvent.unit;
      if (newEvent.newCustodianId) payload.newCustodianId = newEvent.newCustodianId;

      await api.post(`/batches/${id}/events`, payload);
      setAddEventModalOpen(false);
      // Reset form
      setNewEvent({
        eventType: "PROCESSING",
        locationName: "Regional Manufacturing Facility",
        country: "",
        notes: "",
        quantity: "",
        unit: "",
        newCustodianId: "",
      });
      await fetchBatchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to record event");
    } finally {
      setEventSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
          Loading traceability history...
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
        <AlertCircle className="mx-auto h-8 w-8 mb-2 text-rose-600" />
        <h3 className="text-base font-bold">Batch Not Found</h3>
        <p className="text-xs text-rose-600 mt-1">Batch ID '{id}' could not be located in registry.</p>
        <Link to="/batches" className="mt-4 inline-block text-xs font-semibold underline">
          Return to Batches
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                {batch.batchId}
              </span>
              <Badge variant={batch.isFlagged ? "danger" : "info"} size="sm">
                {batch.status}
              </Badge>
              {batch.blockchainStatus === "CONFIRMED" && (
                <Badge variant="success" size="sm">
                  <ShieldCheck className="h-3 w-3" /> Blockchain Anchored
                </Badge>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-2">
              {batch.materialName}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              {batch.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <QrCode className="h-4 w-4 text-brand-700" />
              QR Code
            </button>

            <Link
              to={`/genealogy/${batch.batchId}`}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <GitFork className="h-4 w-4 text-brand-700" />
              Genealogy Tree
            </Link>

            {(user?.role === "SUPPLIER" || user?.role === "MANUFACTURER" || user?.role === "AUDITOR" || user?.role === "ADMIN") && (
              <button
                onClick={() => setAddEventModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800 shadow-sm transition"
              >
                <PlusCircle className="h-4 w-4" />
                Append Event
              </button>
            )}
          </div>
        </div>

        {/* Batch Meta Grid */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Quantity</span>
            <span className="text-base font-bold text-slate-900">
              {batch.quantity.toLocaleString()} {batch.unit}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Origin</span>
            <span className="text-base font-bold text-slate-900">
              {batch.countryOfOrigin}
            </span>
            <span className="text-[11px] text-slate-500 block truncate">{batch.regionOfOrigin}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Registered Supplier</span>
            <span className="text-sm font-bold text-slate-900 block truncate">
              {batch.supplierName}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Current Custodian</span>
            <span className="text-sm font-bold text-slate-900 block truncate">
              {batch.currentCustodianName}
            </span>
          </div>
        </div>

        {/* Responsible Sourcing Declarations */}
        <div className="mt-2 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Supplier Compliance & Sourcing Declarations
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold ${
                batch.sourcingDeclarations?.environmentalCompliance
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              Environmental Compliance: {batch.sourcingDeclarations?.environmentalCompliance ? "Declared" : "No"}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold ${
                batch.sourcingDeclarations?.laborRightsCompliant
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              Labor & Human Rights: {batch.sourcingDeclarations?.laborRightsCompliant ? "Declared" : "No"}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold ${
                batch.sourcingDeclarations?.conflictFreeDeclared
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              Conflict-Free: {batch.sourcingDeclarations?.conflictFreeDeclared ? "Declared" : "No"}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold ${
                batch.sourcingDeclarations?.recycledOrRenewable
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              Recycled/Renewable: {batch.sourcingDeclarations?.recycledOrRenewable ? "Yes" : "No"}
            </span>
          </div>
          {batch.sourcingDeclarations?.details && (
            <p className="mt-2 text-xs text-slate-500 italic">
              "{batch.sourcingDeclarations.details}"
            </p>
          )}
        </div>
      </div>

      {/* Cryptographic Tamper-Evident Verification Widget */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-700" />
              <h2 className="text-base font-bold text-slate-900">
                Cryptographic Integrity & Tamper Detection
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Recalculates canonical SHA-256 hash of every event in MongoDB and compares with immutable smart contract on-chain ledger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(user?.role === "ADMIN" || user?.role === "AUDITOR") && (
              <button
                onClick={() => setTamperModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                title="Academic demonstration: alter DB to see detection"
              >
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Simulate Tamper
              </button>
            )}

            <button
              onClick={runIntegrityAudit}
              disabled={verifying}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${verifying ? "animate-spin" : ""}`} />
              {verifying ? "Auditing Hashes..." : "Run Cryptographic Audit"}
            </button>
          </div>
        </div>

        {integrityReport && (
          <div
            className={`rounded-xl border p-4 text-xs transition ${
              integrityReport.overallStatus === "TAMPERED_DETECTED"
                ? "border-rose-300 bg-rose-50 text-rose-900"
                : integrityReport.overallStatus === "INTACT"
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-sky-300 bg-sky-50 text-sky-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                {integrityReport.overallStatus === "TAMPERED_DETECTED" ? (
                  <>
                    <XCircle className="h-5 w-5 text-rose-600" />
                    <span>TAMPER DETECTED: Database Alteration Found!</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>CRYPTOGRAPHIC PROVENANCE INTACT</span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-slate-500">
                Audited: {new Date(integrityReport.checkedAt).toLocaleTimeString()}
              </span>
            </div>

            <p className="mt-1 text-xs leading-relaxed">
              {integrityReport.overallStatus === "TAMPERED_DETECTED"
                ? `Cryptographic mismatch found in ${integrityReport.tamperedEventsCount} event record(s). Off-chain data does not match the original hash or blockchain anchor.`
                : `All ${integrityReport.totalEvents} events verified against canonical SHA-256 serializer and smart contract state.`}
            </p>

            {/* Individual Event Audit breakdown */}
            <div className="mt-3 space-y-1.5 pt-3 border-t border-slate-200/60 font-mono text-[11px]">
              {integrityReport.eventsReport.map((rep) => (
                <div
                  key={rep.eventId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-white/70 border border-slate-200/50"
                >
                  <span className="font-bold text-slate-800">
                    {rep.eventId} ({rep.eventType})
                  </span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className={rep.isDbIntact ? "text-emerald-700" : "text-rose-600 font-bold"}>
                      DB SHA-256: {rep.isDbIntact ? "MATCH" : "TAMPERED!"}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600">
                      On-Chain: {rep.isOnChainRecorded ? "ANCHORED" : "STANDBY"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Append-Only Traceability Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-700" />
              Append-Only Supply Chain Timeline ({events.length} Events)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical records are immutable; each event is chained to the previous event hash.
            </p>
          </div>
        </div>

        <div className="relative border-l-2 border-brand-200 pl-6 space-y-8 ml-3">
          {events.map((evt, idx) => (
            <div key={evt._id || evt.eventId} className="relative group">
              {/* Dot */}
              <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-700 ring-4 ring-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 shadow-xs transition hover:bg-white hover:shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-900 bg-brand-100 px-2 py-0.5 rounded">
                      #{evt.eventIndex}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {evt.eventType.replace(/_/g, " ")}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 block">{evt.organization}</span>
                      <span className="text-[11px] text-slate-500">{evt.actorName} ({evt.actorRole})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 block">{evt.location?.name}</span>
                      <span className="text-[11px] text-slate-500">{evt.location?.country || batch.countryOfOrigin}</span>
                    </div>
                  </div>

                  {evt.quantity && (
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        {evt.quantity} {evt.unit || batch.unit}
                      </span>
                      <span className="text-[11px] text-slate-500">Processed Quantity</span>
                    </div>
                  )}
                </div>

                {evt.notes && (
                  <p className="mt-3 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                    {evt.notes}
                  </p>
                )}

                {/* Cryptographic Linkage Info */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 font-mono text-[11px] space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-400">Event SHA-256 Hash:</span>
                    <span className="text-slate-800 select-all font-semibold break-all">
                      {evt.eventHash}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-400">Previous Event Hash:</span>
                    <span className="text-slate-500 break-all">
                      {evt.previousEventHash}
                    </span>
                  </div>
                  {evt.blockchainTxHash && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-emerald-700">
                      <span>Blockchain Tx Anchor:</span>
                      <Link
                        to={`/blockchain`}
                        className="hover:underline flex items-center gap-1 break-all"
                      >
                        {evt.blockchainTxHash} <ExternalLink className="h-3 w-3 inline" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sustainability Certificates */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-700" />
              Sourcing & Compliance Certificates ({certificates.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Third-party environmental and human-rights audit documents
            </p>
          </div>
          <Link
            to="/certificates"
            className="text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            Manage Certificates →
          </Link>
        </div>

        {certificates.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No certificates attached to this batch yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{cert.certificateName}</span>
                  <Badge
                    variant={
                      cert.status === "VERIFIED"
                        ? "success"
                        : cert.status === "REJECTED" || cert.status === "DISPUTED"
                        ? "danger"
                        : "warning"
                    }
                    size="sm"
                  >
                    {cert.status}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-500">
                  Issuer: <span className="font-semibold text-slate-700">{cert.issuer}</span> • #{cert.certificateNumber}
                </div>
                <div className="font-mono text-[10px] text-slate-500 break-all">
                  SHA-256: {cert.documentHash}
                </div>
                {cert.reviewerNotes && (
                  <div className="rounded bg-white p-2 text-[11px] border border-slate-200 text-slate-600">
                    <strong>Auditor Note:</strong> {cert.reviewerNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {addEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Append New Traceability Event
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Event will be canonically serialized, SHA-256 hashed, and anchored on the blockchain contract.
            </p>

            <form onSubmit={handleAddEventSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Type</label>
                <select
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white"
                >
                  <option value="INITIAL_INSPECTION">INITIAL_INSPECTION</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="CERTIFICATION_REVIEW">CERTIFICATION_REVIEW</option>
                  <option value="TRANSPORTATION">TRANSPORTATION</option>
                  <option value="WAREHOUSE_RECEIPT">WAREHOUSE_RECEIPT</option>
                  <option value="MANUFACTURING">MANUFACTURING</option>
                  <option value="CUSTODY_TRANSFER">CUSTODY_TRANSFER</option>
                  <option value="AUDIT_FLAG">AUDIT_FLAG</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility / Location Name</label>
                <input
                  type="text"
                  required
                  value={newEvent.locationName}
                  onChange={(e) => setNewEvent({ ...newEvent, locationName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity (Optional)</label>
                  <input
                    type="number"
                    value={newEvent.quantity}
                    onChange={(e) => setNewEvent({ ...newEvent, quantity: e.target.value })}
                    placeholder={batch.quantity.toString()}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newEvent.unit}
                    onChange={(e) => setNewEvent({ ...newEvent, unit: e.target.value })}
                    placeholder={batch.unit}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Notes & Findings</label>
                <textarea
                  rows={3}
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  placeholder="Details of processing step, quality checks, carrier bill of lading, etc."
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddEventModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={eventSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 shadow-sm transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {eventSubmitting ? "Submitting..." : "Append Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModalOpen && (
        <QRModal
          batch={batch}
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
        />
      )}

      {/* Tamper Simulation Modal */}
      {tamperModalOpen && (
        <TamperModal
          batchId={batch.batchId}
          isOpen={tamperModalOpen}
          onClose={() => setTamperModalOpen(false)}
          onTampered={() => {
            setTamperModalOpen(false);
            fetchBatchData();
            runIntegrityAudit();
          }}
        />
      )}
    </div>
  );
};
