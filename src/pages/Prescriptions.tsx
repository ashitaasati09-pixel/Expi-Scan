import { useState } from "react";
import { FileText, Upload, X, CheckCircle, Clock, AlertCircle, Eye, Download, Trash2, Plus } from "lucide-react";
import { usePrescriptions } from "../hooks/usePrescriptions";
import StatusBadge from "../components/StatusBadge";
import type { Prescription } from "../lib/types";

type View = "list" | "upload" | "review";

export default function Prescriptions() {
  const { prescriptions, loading, upload, update, approveMedicines, remove } = usePrescriptions();
  const [view, setView] = useState<View>("list");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingPx, setPendingPx] = useState<Prescription | null>(null);
  const [editedMeds, setEditedMeds] = useState<any[]>([]);
  const [approveSuccess, setApproveSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const startUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    setPendingPx(null);
    setView("review");
    const res = await upload(file);
    setUploading(false);
    if (res.success && res.data) {
      setPendingPx(res.data);
      setEditedMeds(res.data.extractedMedicines.map((m: any) => ({ ...m })));
    } else {
      setUploadError(res.error || "Couldn't process this prescription. Please try again.");
    }
  };

  const handleApprove = () => {
    if (!pendingPx) return;
    approveMedicines(pendingPx._id, editedMeds);
    setApproveSuccess(true);
    setTimeout(() => { setApproveSuccess(false); setPendingPx(null); setView("list"); }, 1500);
  };

  const statusIcon = (s: string) => s === "processed"
    ? <CheckCircle size={14} className="text-emerald-600" />
    : s === "processing" ? <Clock size={14} className="text-amber-500" />
    : <AlertCircle size={14} className="text-red-500" />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {view === "list" && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Prescriptions</h1>
              <p className="text-slate-500 text-sm mt-0.5">{prescriptions.length} prescription{prescriptions.length !== 1 ? "s" : ""} uploaded</p>
            </div>
            <button onClick={() => setView("upload")}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm">
              <Upload size={16} /> Upload Prescription
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <FileText size={40} className="text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-700 mb-1">No prescriptions yet</h3>
              <p className="text-slate-400 text-sm mb-6">Upload a prescription to digitally extract medicine information.</p>
              <button onClick={() => setView("upload")}
                className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700">
                <Upload size={16} /> Upload Prescription
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map(px => (
                <div key={px._id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                      ${px.processingStatus === "processed" ? "bg-emerald-100" : px.processingStatus === "processing" ? "bg-amber-100" : "bg-red-100"}`}>
                      <FileText size={22} className={px.processingStatus === "processed" ? "text-emerald-600" : px.processingStatus === "processing" ? "text-amber-500" : "text-red-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-800">{px.doctorName || "Processing…"}</h3>
                        <div className="flex items-center gap-1">
                          {statusIcon(px.processingStatus)}
                          <StatusBadge status={px.processingStatus} />
                        </div>
                      </div>
                      {px.clinicName && <p className="text-sm text-slate-500">{px.clinicName} · {px.prescriptionDate}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">{px.fileName}</p>
                      {px.extractedMedicines.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {px.extractedMedicines.map((m, i) => (
                            <span key={i} className="bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full border border-teal-100">
                              {m.name} {m.dosage}
                            </span>
                          ))}
                        </div>
                      )}
                      {px.processingStatus === "processing" && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                          <span className="w-3 h-3 border-2 border-amber-400 border-t-amber-600 rounded-full animate-spin" />
                          Digitally extracting readable medicine information…
                        </div>
                      )}
                      {px.processingStatus === "failed" && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-red-500">
                          <AlertCircle size={12} />
                          Extraction failed. Delete and try uploading again.
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"><Eye size={15} /></button>
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Download size={15} /></button>
                      <button onClick={() => remove(px._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "upload" && (
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView("list")} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><X size={18} /></button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Upload Prescription</h1>
              <p className="text-slate-500 text-sm">Digitally extracted readable medicine information</p>
            </div>
          </div>

          <div
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) startUpload(f); }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
              ${dragging ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30"}`}
            onClick={() => document.getElementById("rx-upload")?.click()}
          >
            <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload size={28} className="text-teal-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Drop your prescription here</h3>
            <p className="text-slate-500 text-sm mb-4">or click to browse files</p>
            <div className="flex justify-center gap-2">
              {["JPG", "PNG", "PDF"].map(t => (
                <span key={t} className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full font-medium">{t}</span>
              ))}
            </div>
            <input id="rx-upload" type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
              onChange={e => e.target.files?.[0] && startUpload(e.target.files[0])} />
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-800 mb-1">How it works</p>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Upload your prescription image or PDF</li>
              <li>We digitally extract readable medicine information</li>
              <li>Review the extracted data for accuracy</li>
              <li>Approve to add medicines to your cabinet</li>
            </ol>
          </div>
        </div>
      )}

      {view === "review" && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => { setView("list"); setPendingPx(null); setUploadError(""); }} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><X size={18} /></button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Review Extracted Data</h1>
              <p className="text-slate-500 text-sm">Digitally extracted readable medicine information</p>
            </div>
          </div>

          {uploading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="w-8 h-8 border-[3px] border-teal-200 border-t-teal-600 rounded-full animate-spin" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Processing prescription…</h3>
              <p className="text-slate-500 text-sm">Digitally extracting readable medicine information. This takes a few seconds.</p>
            </div>
          ) : uploadError ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Processing failed</h3>
              <p className="text-slate-500 text-sm mb-6">{uploadError}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => { setUploadError(""); setView("list"); }}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back to List
                </button>
                <button
                  onClick={() => { setUploadError(""); setView("upload"); }}
                  className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : approveSuccess ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Medicines Added!</h3>
              <p className="text-slate-500 text-sm">All extracted medicines have been added to your cabinet.</p>
            </div>
          ) : pendingPx && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-800 mb-4">Doctor Information</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: "Doctor Name", value: pendingPx.doctorName, key: "doctorName" },
                    { label: "Hospital/Clinic", value: pendingPx.clinicName, key: "clinicName" },
                    { label: "Prescription Date", value: pendingPx.prescriptionDate, key: "prescriptionDate" },
                  ].map(item => (
                    <div key={item.key}>
                      <label className="text-xs text-slate-400 block mb-1">{item.label}</label>
                      <input defaultValue={item.value}
                        onChange={e => update(pendingPx._id, { [item.key]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800">Extracted Medicines</h3>
                  <span className="text-xs text-slate-400">{pendingPx.extractedMedicines.length} medicines found</span>
                </div>
                {editedMeds.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <AlertCircle size={28} className="text-amber-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700 mb-1">No medicines detected</p>
                    <p className="text-xs text-slate-400">We couldn't confidently read any medicines from this file. Try a clearer photo, better lighting, or add medicines manually.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {editedMeds.map((med, i) => (
                      <div key={i} className="px-5 py-4">
                        <div className="grid sm:grid-cols-5 gap-3 mb-2">
                          {[
                            { label: "Medicine Name", key: "name" },
                            { label: "Dosage", key: "dosage" },
                            { label: "Frequency", key: "frequency" },
                            { label: "Duration", key: "duration" },
                            { label: "Qty", key: "quantity", type: "number" },
                          ].map(f => (
                            <div key={f.key}>
                              <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                              <input type={f.type || "text"} value={med[f.key]}
                                onChange={e => setEditedMeds(ms => ms.map((m, j) => j === i ? { ...m, [f.key]: e.target.value } : m))}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400" />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${med.confidence * 100}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 flex-shrink-0">Confidence: {Math.round(med.confidence * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setPendingPx(null); setView("list"); }}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleApprove} disabled={editedMeds.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
                  <Plus size={16} /> Approve & Add Medicines
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}