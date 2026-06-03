"use client";

import React, { useRef, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, Link, Minus,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
}

function ToolbarButton({ icon, title, onClick, active = false }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent losing editor focus
        onClick();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "6px",
        border: "none",
        background: active ? "var(--primary-50, #e0f2fe)" : "transparent",
        color: active ? "#0369a1" : "var(--text-main)",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
    >
      {icon}
    </button>
  );
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    // Sync content back
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Sync external value only on mount (avoid cursor jump on every keystroke)
  const initialized = useRef(false);
  const setInitialContent = useCallback((el: HTMLDivElement | null) => {
    if (el && !initialized.current) {
      el.innerHTML = value || "";
      initialized.current = true;
    }
    (editorRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, []);

  const addLink = () => {
    const url = prompt("Masukkan URL:");
    if (url) exec("createLink", url);
  };

  return (
    <div style={{ border: "1px solid var(--border-color)", borderRadius: "10px", overflow: "hidden" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "2px",
          padding: "8px 12px",
          background: "var(--bg-main)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <ToolbarButton icon={<Bold size={15} />} title="Tebal (Ctrl+B)" onClick={() => exec("bold")} />
        <ToolbarButton icon={<Italic size={15} />} title="Miring (Ctrl+I)" onClick={() => exec("italic")} />
        <ToolbarButton icon={<Underline size={15} />} title="Garis Bawah (Ctrl+U)" onClick={() => exec("underline")} />
        <ToolbarButton icon={<Strikethrough size={15} />} title="Coret" onClick={() => exec("strikeThrough")} />

        <div style={{ width: "1px", background: "var(--border-color)", margin: "2px 6px" }} />

        <ToolbarButton icon={<Heading1 size={15} />} title="Judul 1" onClick={() => exec("formatBlock", "h1")} />
        <ToolbarButton icon={<Heading2 size={15} />} title="Judul 2" onClick={() => exec("formatBlock", "h2")} />
        <ToolbarButton icon={<Heading3 size={15} />} title="Judul 3" onClick={() => exec("formatBlock", "h3")} />

        <div style={{ width: "1px", background: "var(--border-color)", margin: "2px 6px" }} />

        <ToolbarButton icon={<List size={15} />} title="Daftar Bullet" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton icon={<ListOrdered size={15} />} title="Daftar Bernomor" onClick={() => exec("insertOrderedList")} />

        <div style={{ width: "1px", background: "var(--border-color)", margin: "2px 6px" }} />

        <ToolbarButton icon={<AlignLeft size={15} />} title="Rata Kiri" onClick={() => exec("justifyLeft")} />
        <ToolbarButton icon={<AlignCenter size={15} />} title="Rata Tengah" onClick={() => exec("justifyCenter")} />
        <ToolbarButton icon={<AlignRight size={15} />} title="Rata Kanan" onClick={() => exec("justifyRight")} />

        <div style={{ width: "1px", background: "var(--border-color)", margin: "2px 6px" }} />

        <ToolbarButton icon={<Link size={15} />} title="Sisipkan Tautan" onClick={addLink} />
        <ToolbarButton icon={<Minus size={15} />} title="Garis Pemisah" onClick={() => exec("insertHorizontalRule")} />
      </div>

      {/* Editor Area */}
      <div
        ref={setInitialContent}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{
          minHeight: "340px",
          padding: "16px 20px",
          outline: "none",
          background: "var(--bg-card)",
          color: "var(--text-main)",
          fontSize: "1rem",
          lineHeight: "1.75",
          fontFamily: "inherit",
        }}
      />

      <style>{`
        [contenteditable] h1 { font-size: 1.6rem; font-weight: 700; margin: 12px 0 6px; }
        [contenteditable] h2 { font-size: 1.3rem; font-weight: 700; margin: 12px 0 6px; }
        [contenteditable] h3 { font-size: 1.1rem; font-weight: 600; margin: 10px 0 4px; }
        [contenteditable] ul { padding-left: 20px; list-style-type: disc; }
        [contenteditable] ol { padding-left: 20px; list-style-type: decimal; }
        [contenteditable] li { margin: 4px 0; }
        [contenteditable] a { color: #008CBA; text-decoration: underline; }
        [contenteditable] hr { border: none; border-top: 1px solid var(--border-color); margin: 12px 0; }
        [contenteditable]:focus { outline: none; }
        [contenteditable]:empty:before {
          content: "Tulis notulensi rapat di sini... Gunakan toolbar di atas untuk memformat teks.";
          color: var(--text-muted);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
