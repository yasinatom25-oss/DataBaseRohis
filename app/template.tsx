"use client";

import React from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  // Return fragment agar tidak membuat containing block baru untuk elemen fixed (Sidebar)
  return <>{children}</>;
}
