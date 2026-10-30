import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, ExternalLink, Download, Copy, Check } from "lucide-react";
import { Batch } from "../types";

interface QRModalProps {
  batch: Batch;
  isOpen: boolean;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ batch, isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/public/verify/${batch.batchId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const a = document.createElement("a");
        a.download = `QR-${batch.batchId}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-center">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="text-sm font-bold text-slate-900">
            Batch Traceability QR Card
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="text-base font-bold text-slate-900 leading-snug">
            {batch.materialName}
          </div>
          <div className="font-mono text-xs font-semibold text-brand-700 mt-1">
            {batch.batchId}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {batch.countryOfOrigin} • {batch.quantity} {batch.unit}
          </div>
        </div>

        <div
          ref={qrRef}
          className="mx-auto flex w-fit items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <QRCodeSVG
            value={publicUrl}
            size={200}
            level="H"
            fgColor="#064e3b"
            includeMargin={true}
          />
        </div>

        <p className="mt-3 text-[11px] text-slate-600">
          Scan using any smartphone camera to open the public consumer verification portal.
        </p>

        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied Link" : "Copy Link"}
            </button>
          </div>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-brand-700 py-2.5 text-xs font-semibold text-white hover:bg-brand-800 transition shadow-sm"
          >
            <ExternalLink className="h-4 w-4" />
            Open Public Verification Page
          </a>
        </div>
      </div>
    </div>
  );
};
