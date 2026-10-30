import React, { useEffect, useState } from "react";
import { Blocks, Search, ExternalLink, ShieldCheck, CheckCircle2, Clock, Hash, AlertCircle } from "lucide-react";
import { api } from "../api/client";
import { Badge } from "../components/Badge";

export const BlockchainExplorer: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [txHashInput, setTxHashInput] = useState("");
  const [searchedTx, setSearchedTx] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get("/blockchain/status");
        if (res.data.success) {
          setStatus(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load blockchain status:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleTxSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHashInput.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchedTx(null);

    try {
      const res = await api.get(`/blockchain/transactions/${txHashInput.trim()}`);
      if (res.data.success) {
        setSearchedTx(res.data.data);
      }
    } catch (err: any) {
      setSearchError(err.response?.data?.message || "Transaction not found on local blockchain network");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Blocks className="h-6 w-6 text-brand-700" />
          Blockchain Ledger & Smart Contract Explorer
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore on-chain cryptographic anchors, contract deployments, and transaction receipts
        </p>
      </div>

      {/* Contract & Node Info Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              EVM Smart Contract Instance
            </span>
            <div className="text-sm font-bold text-slate-900">
              RawMaterialTraceability.sol (Solidity 0.8.20)
            </div>
            <div className="font-mono text-xs text-brand-800 break-all">
              Address: <span className="font-semibold">{status?.contractAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status?.isAvailable ? (
              <Badge variant="success">EVM Local Node Active</Badge>
            ) : (
              <Badge variant="warning">Node Offline / Standby</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">RPC URL</span>
            <span className="font-mono font-semibold text-slate-800">{status?.rpcUrl || "http://127.0.0.1:8545"}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Chain Network</span>
            <span className="font-semibold text-slate-800">{status?.network || "Hardhat (ChainID: 31337)"}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Integrity Model</span>
            <span className="font-semibold text-emerald-700">Canonical SHA-256 + EVM Proof</span>
          </div>
        </div>
      </div>

      {/* Transaction Lookup Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Query Blockchain Transaction Receipt</h2>
        <form onSubmit={handleTxSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Hash className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={txHashInput}
              onChange={(e) => setTxHashInput(e.target.value)}
              placeholder="Paste transaction hash (0x...)"
              className="w-full rounded-xl border border-slate-300 font-mono pl-9 pr-3 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="rounded-xl bg-brand-700 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-800 transition disabled:opacity-50"
          >
            {searching ? "Querying..." : "Verify on Node"}
          </button>
        </form>

        {searchError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{searchError}</span>
          </div>
        )}

        {searchedTx && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between font-sans">
              <span className="font-bold text-emerald-900">Transaction Confirmed on EVM</span>
              <Badge variant="success" size="sm">{searchedTx.status}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-emerald-200">
              <div>
                <span className="text-slate-500 block font-sans">Block Number:</span>
                <span className="font-bold text-slate-800">#{searchedTx.blockNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">Gas Used:</span>
                <span className="text-slate-800">{searchedTx.gasUsed}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">From Account:</span>
                <span className="break-all text-slate-700">{searchedTx.from}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">Contract To:</span>
                <span className="break-all text-slate-700">{searchedTx.to}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Educational Notice on Blockchain Sourcing */}
      <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-5 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-700" />
          Technical Truth: What Blockchain Does and Does Not Prove
        </div>
        <p className="leading-relaxed">
          The smart contract acts as an immutable, tamper-evident digital anchor. When an event or document is hashed with SHA-256 and committed to the blockchain, nobody—not even system administrators or database operators—can silently modify that historical record without the recalculation check sounding an alarm.
        </p>
        <p className="leading-relaxed">
          However, an on-chain hash does not physically guarantee that the physical dirt or metal in the container matches the invoice. Physical integrity requires accredited site auditors, chemical assays, and chain-of-custody seals—which are then mathematically protected by the blockchain.
        </p>
      </div>
    </div>
  );
};
