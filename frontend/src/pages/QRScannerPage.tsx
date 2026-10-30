import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Camera, Upload, ArrowRight, AlertCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [manualBatchId, setManualBatchId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const handleScanSuccess = (decodedText: string) => {
    // If it's a URL, extract the batchId from it
    let batchId = decodedText;
    if (decodedText.includes("/public/verify/")) {
      const parts = decodedText.split("/public/verify/");
      batchId = parts[1];
    } else if (decodedText.includes("/batches/")) {
      const parts = decodedText.split("/batches/");
      batchId = parts[1];
    }
    stopScanner();
    navigate(`/public/verify/${batchId.trim()}`);
  };

  const startScanner = async () => {
    setScanError(null);
    setScanning(true);
    try {
      const scanner = new Html5Qrcode("qr-reader-container");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => {}
      );
    } catch (err: any) {
      setScanError(err.message || "Could not access camera. Please check permissions or upload a QR image.");
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError(null);
    try {
      const html5QrCode = new Html5Qrcode("qr-reader-container-hidden");
      const decoded = await html5QrCode.scanFile(file, true);
      handleScanSuccess(decoded);
    } catch (err: any) {
      setScanError("No QR code detected in the uploaded image. Please try another image.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBatchId.trim()) return;
    navigate(`/public/verify/${manualBatchId.trim()}`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 border border-brand-200">
          <QrCode className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mt-3">
          Scan Material Batch QR Code
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Scan physical raw material packaging labels or enter a batch ID to verify origin and blockchain evidence
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        {scanError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Live Camera Scanner Box */}
        <div className="space-y-3 text-center">
          <div
            id="qr-reader-container"
            className="w-full min-h-[260px] rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden"
          >
            {!scanning && (
              <div className="p-6 text-xs text-slate-400 space-y-2">
                <Camera className="mx-auto h-8 w-8 text-slate-400" />
                <p>Camera is currently standby. Click below to start live scanning.</p>
              </div>
            )}
          </div>
          <div id="qr-reader-container-hidden" className="hidden" />

          {scanning ? (
            <button
              onClick={stopScanner}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              Stop Camera
            </button>
          ) : (
            <button
              onClick={startScanner}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-800 transition shadow-sm mx-auto"
            >
              <Camera className="h-4 w-4" />
              Open Camera Scanner
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Or upload image</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* File Upload QR Decoder */}
        <div className="text-center">
          <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer">
            <Upload className="h-4 w-4 text-brand-700" />
            <span>Select QR Code Image File</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Or enter batch id</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Manual Input Fallback */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualBatchId}
            onChange={(e) => setManualBatchId(e.target.value)}
            placeholder="e.g. BATCH-LITH-2026-001"
            className="flex-1 rounded-xl border border-slate-300 font-mono px-3.5 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            <span>Verify</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
