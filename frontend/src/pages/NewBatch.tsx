import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Sparkles, MapPin, ShieldCheck, AlertCircle } from "lucide-react";
import { api } from "../api/client";

export const NewBatch: React.FC = () => {
  const navigate = useNavigate();

  const presets = [
    {
      name: "Battery-Grade Lithium Hydroxide (LiOH)",
      category: "Mineral",
      unit: "kg",
      country: "Chile",
      region: "Salar de Atacama, Antofagasta",
      locName: "Salar de Atacama Brine Evaporation Basin 4B",
      lat: -23.499,
      lng: -68.329,
      desc: "Solar brine-extracted high-purity lithium hydroxide for EV battery cathodes.",
    },
    {
      name: "Responsible Cathode Copper (Grade A)",
      category: "Metal",
      unit: "metric_ton",
      country: "Democratic Republic of Congo",
      region: "Haut-Katanga",
      locName: "Kolwezi Artisanal Traceability Perimeter",
      lat: -10.716,
      lng: 25.472,
      desc: "OECD due-diligence compliant copper cathode produced with low freshwater footprint.",
    },
    {
      name: "Fairtrade Organic Raw Cotton",
      category: "Fiber",
      unit: "bale",
      country: "India",
      region: "Gujarat, Saurashtra",
      locName: "Rajkot Ginning & Pressing Cooperative",
      lat: 22.303,
      lng: 70.802,
      desc: "Non-GMO organic certified long-staple cotton harvested by smallholders.",
    },
    {
      name: "Post-Consumer Recycled 6061 Aluminum Alloy",
      category: "Recycled",
      unit: "metric_ton",
      country: "Germany",
      region: "Baden-Württemberg",
      locName: "Heidelberg Circular Metallurgy Facility",
      lat: 49.398,
      lng: 8.672,
      desc: "100% pre-sorted post-consumer scrap billet saving 95% embodied emissions.",
    },
  ];

  const [formData, setFormData] = useState({
    batchId: "",
    materialName: presets[0].name,
    materialCategory: presets[0].category,
    description: presets[0].desc,
    quantity: 5000,
    unit: presets[0].unit,
    countryOfOrigin: presets[0].country,
    regionOfOrigin: presets[0].region,
    sourceLocationName: presets[0].locName,
    latitude: presets[0].lat,
    longitude: presets[0].lng,
    extractionDate: new Date().toISOString().split("T")[0],
    environmentalCompliance: true,
    laborRightsCompliant: true,
    conflictFreeDeclared: true,
    recycledOrRenewable: false,
    sourcingDetails: "Conforms to responsible sourcing standards; zero unauthorized groundwater extraction.",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (preset: typeof presets[0]) => {
    setFormData((prev) => ({
      ...prev,
      materialName: preset.name,
      materialCategory: preset.category,
      unit: preset.unit,
      countryOfOrigin: preset.country,
      regionOfOrigin: preset.region,
      sourceLocationName: preset.locName,
      latitude: preset.lat,
      longitude: preset.lng,
      description: preset.desc,
      recycledOrRenewable: preset.category === "Recycled",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        batchId: formData.batchId || undefined,
        materialName: formData.materialName,
        materialCategory: formData.materialCategory,
        description: formData.description,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        countryOfOrigin: formData.countryOfOrigin,
        regionOfOrigin: formData.regionOfOrigin,
        sourceLocation: {
          name: formData.sourceLocationName,
          latitude: formData.latitude ? Number(formData.latitude) : undefined,
          longitude: formData.longitude ? Number(formData.longitude) : undefined,
        },
        extractionDate: formData.extractionDate,
        sourcingDeclarations: {
          environmentalCompliance: formData.environmentalCompliance,
          laborRightsCompliant: formData.laborRightsCompliant,
          conflictFreeDeclared: formData.conflictFreeDeclared,
          recycledOrRenewable: formData.recycledOrRenewable,
          details: formData.sourcingDetails,
        },
      };

      const res = await api.post("/batches", payload);
      if (res.data.success) {
        navigate(`/batches/${res.data.data.batch.batchId}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to register batch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <PlusCircle className="h-6 w-6 text-brand-700" />
          Register Raw Material Batch
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Anchor a newly extracted, harvested, or recycled raw material batch into the blockchain traceability registry
        </p>
      </div>

      {/* Preset Quick-Fill Pills */}
      <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900">
          <Sparkles className="h-4 w-4 text-brand-600" />
          Quick Template Autofill:
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-xl border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100 transition shadow-xs"
            >
              {p.category}: {p.name.split(" ")[0]} ({p.country})
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Material Identity */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 pb-1 border-b border-slate-100">
              1. Material Identity & Metadata
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Material Name</label>
                <input
                  type="text"
                  required
                  value={formData.materialName}
                  onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formData.materialCategory}
                  onChange={(e) => setFormData({ ...formData, materialCategory: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white"
                >
                  <option value="Mineral">Mineral</option>
                  <option value="Metal">Metal</option>
                  <option value="Fiber">Fiber</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Recycled">Recycled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Custom Batch ID (Leave blank to auto-generate)
                </label>
                <input
                  type="text"
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  placeholder="e.g. BATCH-LITH-2026-909"
                  className="w-full rounded-xl border border-slate-300 font-mono p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit of Measurement</label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="kg, metric_ton, bale"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Material Description</label>
              <textarea
                rows={2}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              />
            </div>
          </div>

          {/* Geographical Origin */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-brand-700" />
              2. Provenance & Geographical Origin
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Country of Origin</label>
                <input
                  type="text"
                  required
                  value={formData.countryOfOrigin}
                  onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Region / Basin</label>
                <input
                  type="text"
                  required
                  value={formData.regionOfOrigin}
                  onChange={(e) => setFormData({ ...formData, regionOfOrigin: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility / Mine Site Name</label>
                <input
                  type="text"
                  required
                  value={formData.sourceLocationName}
                  onChange={(e) => setFormData({ ...formData, sourceLocationName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Extraction / Harvest Date</label>
              <input
                type="date"
                required
                value={formData.extractionDate}
                onChange={(e) => setFormData({ ...formData, extractionDate: e.target.value })}
                className="w-full md:w-1/3 rounded-xl border border-slate-300 p-2.5 text-xs"
              />
            </div>
          </div>

          {/* Sourcing Compliance Declarations */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand-700" />
              3. Sourcing Compliance Declarations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.environmentalCompliance}
                  onChange={(e) => setFormData({ ...formData, environmentalCompliance: e.target.checked })}
                  className="rounded text-brand-700 focus:ring-brand-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-800">Environmental Compliance Declared</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.laborRightsCompliant}
                  onChange={(e) => setFormData({ ...formData, laborRightsCompliant: e.target.checked })}
                  className="rounded text-brand-700 focus:ring-brand-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-800">Fair Labor & Human Rights Compliant</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.conflictFreeDeclared}
                  onChange={(e) => setFormData({ ...formData, conflictFreeDeclared: e.target.checked })}
                  className="rounded text-brand-700 focus:ring-brand-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-800">Conflict-Free Origin Declaration</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.recycledOrRenewable}
                  onChange={(e) => setFormData({ ...formData, recycledOrRenewable: e.target.checked })}
                  className="rounded text-brand-700 focus:ring-brand-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-800">Recycled / Renewable Material Claim</span>
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Compliance Details & Declarations</label>
              <textarea
                rows={2}
                value={formData.sourcingDetails}
                onChange={(e) => setFormData({ ...formData, sourcingDetails: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/batches")}
              className="rounded-xl border border-slate-200 px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 font-semibold text-white hover:bg-brand-800 shadow-sm transition disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              {isSubmitting ? "Anchoring on Blockchain..." : "Register Batch Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
