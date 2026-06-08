import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Save } from "lucide-react";

const MUTABAAH_PARAMS = [
  { id: 1, name: "Shalat Tepat Waktu", unit: "kali", standard: 35 },
  { id: 2, name: "Shalat Tahajud", unit: "kali", standard: 7 },
  { id: 3, name: "Shalat Duha", unit: "kali", standard: 7 },
  { id: 4, name: "Shalat Rawatib", unit: "kali", standard: 35 },
  { id: 5, name: "Saum Sunnah", unit: "kali", standard: 2 },
  { id: 6, name: "Tilawah", unit: "halaman", standard: 35 },
  { id: 7, name: "Tambahan Hafalan", unit: "baris", standard: 15 },
  { id: 8, name: "Capaian Hafalan", unit: "baris", standard: null },
  { id: 9, name: "Al-Matsurat Pagi", unit: "kali", standard: 7 },
  { id: 10, name: "Al-Matsurat Sore", unit: "kali", standard: 7 },
  { id: 11, name: "Birrul Walidain", unit: "kali", standard: 7 },
  { id: 12, name: "Infaq", unit: "kali", standard: 1 },
  { id: 13, name: "Menambah Wawasan Islami", unit: "kali", standard: 1 },
];

export default function MutabaahFormModal({ existingLog, userLogs = [], userId, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const yyyy = monday.getFullYear();
    const mm = String(monday.getMonth() + 1).padStart(2, '0');
    const dd = String(monday.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const weekOptions = React.useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (i * 7));
      const mondayStr = getMonday(d);
      let label = "Pekan Ini";
      if (i === 1) label = "Pekan Lalu";
      if (i > 1) label = `${i} Pekan Lalu`;
      options.push({ label: `${label} (Mulai ${mondayStr})`, value: mondayStr });
    }
    return options;
  }, []);

  // Default to current week's Monday, unless an existingLog was passed, then default to that log's week
  const initialWeek = existingLog ? getMonday(new Date(existingLog.log_date)) : weekOptions[0].value;
  const [selectedWeek, setSelectedWeek] = useState(initialWeek);

  const [values, setValues] = useState<Record<number, number>>({});
  const [hafalanText, setHafalanText] = useState("");

  React.useEffect(() => {
    const logForWeek = userLogs.find((l: any) => getMonday(new Date(l.log_date)) === selectedWeek);
    const newValues: Record<number, number> = {};
    for (let i = 1; i <= 13; i++) {
      newValues[i] = logForWeek ? logForWeek[`param_${i}_val`] : 0;
    }
    setValues(newValues);
    setHafalanText(logForWeek?.hafalan_text || "");
  }, [selectedWeek, userLogs]);

  const handleInputChange = (id: number, val: string) => {
    const num = parseInt(val, 10);
    setValues(prev => ({ ...prev, [id]: isNaN(num) ? 0 : num }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: any = {
        user_id: userId,
        hafalan_text: hafalanText,
      };
      
      for (let i = 1; i <= 13; i++) {
        payload[`param_${i}_val`] = values[i];
      }

      const currentLog = userLogs.find((l: any) => getMonday(new Date(l.log_date)) === selectedWeek);

      if (currentLog) {
        // Edit mode
        const { error: err } = await supabase
          .from("mutabaah_logs")
          .update(payload)
          .eq("id", currentLog.id);
        if (err) throw err;
      } else {
        // Create mode
        payload.log_date = selectedWeek; // strictly set to the Monday of that week
        const { error: err } = await supabase
          .from("mutabaah_logs")
          .insert([payload]);
        if (err) throw err;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Gagal menyimpan data mutabaah. Coba lagi.");
    }
    setLoading(false);
  };

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
              Isi Mutabaah Ibadah
            </h2>
            <div style={{ marginTop: "12px" }}>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem", outline: "none", width: "100%", maxWidth: "300px" }}
              >
                {weekOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "12px" }}>
              Silakan ketik angka pencapaian ibadah Anda selama pekan yang dipilih.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "24px" }}>
          {error && (
            <div style={{ background: "var(--danger-bg)", color: "var(--danger-text)", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "20px", border: "1px solid var(--danger-border)" }}>
              {error}
            </div>
          )}

          <form id="mutabaah-form" onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {MUTABAAH_PARAMS.map(param => (
                <div key={param.id} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ marginBottom: "8px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", display: "block" }}>
                      {param.name}
                    </label>
                    {param.standard !== null ? (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Target: {param.standard} {param.unit}/pekan
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        (Opsional/Sesuai Kemampuan)
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="number"
                      min="0"
                      value={(values[param.id] || 0).toString()}
                      onChange={e => handleInputChange(param.id, e.target.value)}
                      style={{
                        flex: 1, padding: "10px 14px", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.9rem", outline: "none"
                      }}
                      required
                    />
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", width: "40px" }}>{param.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "24px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px", display: "block" }}>
                Keterangan Tambah Hafalan (Surah / Ayat)
              </label>
              <textarea
                value={hafalanText}
                onChange={e => setHafalanText(e.target.value)}
                placeholder="Contoh: Al-Mulk ayat 1-10"
                style={{
                  width: "100%", padding: "10px 14px", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.9rem", outline: "none", minHeight: "80px", resize: "vertical"
                }}
              />
            </div>
          </form>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button type="button" onClick={onClose}
            style={{ padding: "10px 16px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>
            Batal
          </button>
          <button type="submit" form="mutabaah-form" disabled={loading}
            style={{ padding: "10px 16px", border: "none", background: "#008CBA", color: "#ffffff", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            <Save size={16} />
            {loading ? "Menyimpan..." : "Simpan Mutabaah"}
          </button>
        </div>
      </div>
    </div>
  );
}
