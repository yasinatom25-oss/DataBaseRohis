"use client";

import React from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  // File template.tsx akan di-mount ulang oleh Next.js setiap kali pindah rute (halaman),
  // sehingga animasi CSS .page-transition akan selalu terpicu ulang.
  return <div className="page-transition">{children}</div>;
}
