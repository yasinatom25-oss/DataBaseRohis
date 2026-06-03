import React from "react";
import { X } from "lucide-react";

const MUTABAAH_PARAMS = [
  { id: 1, name: "Shalat Tepat Waktu", unit: "kali" },
  { id: 2, name: "Shalat Tahajud", unit: "kali" },
  { id: 3, name: "Shalat Duha", unit: "kali" },
  { id: 4, name: "Shalat Rawatib", unit: "kali" },
  { id: 5, name: "Saum Sunnah", unit: "kali" },
  { id: 6, name: "Tilawah", unit: "halaman" },
  { id: 7, name: "Tambahan Hafalan", unit: "baris" },
  { id: 8, name: "Capaian Hafalan", unit: "baris" },
  { id: 9, name: "Al-Matsurat Pagi", unit: "kali" },
  { id: 10, name: "Al-Matsurat Sore", unit: "kali" },
  { id: 11, name: "Birrul Walidain", unit: "kali" },
  { id: 12, name: "Infaq", unit: "kali" },
  { id: 13, name: "Menambah Wawasan Islami", unit: "kali" },
];

export default function MutabaahDetailModal({ log, onClose }: { log: any, onClose: () => void }) {
  if (!log || !log.raw) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      padding: "20px"
    }}>
      <div className="animate-fade-in-up" style={{
        background: "var(--bg-card)", borderRadius: "16px", width: "100%", maxWidth: "650px", maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              Detail Mutabaah - {log.name}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
              Tanggal Pengisian: {new Date(log.date).toLocaleDateString("id-ID")} | Rata-rata: {log.average}%
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {MUTABAAH_PARAMS.map(param => {
              const val = log.raw[`param_${param.id}_val`] || 0;
              return (
                <div key={param.id} style={{ display: "flex", flexDirection: "column", padding: "12px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>{param.name}</span>
                  <span style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)" }}>
                    {val} <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>{param.unit}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "20px", padding: "16px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px", display: "block" }}>Keterangan / Tambahan Hafalan</span>
            <span style={{ fontSize: "0.95rem", color: "var(--text-main)", whiteSpace: "pre-wrap" }}>
              {log.raw.hafalan_text || "-"}
            </span>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose}
            style={{ padding: "10px 16px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
