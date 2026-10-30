import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 px-4 md:px-8 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-semibold text-slate-700">
            Blockchain-Based Responsible Raw Material Traceability System
          </span>
          <span className="mx-2">•</span>
          <span>Final Year Academic Project</span>
        </div>
        <div className="text-[11px] text-slate-600">
          Smart Contract: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">RawMaterialTraceability.sol</code> (Solidity 0.8.20)
        </div>
      </div>
    </footer>
  );
};
