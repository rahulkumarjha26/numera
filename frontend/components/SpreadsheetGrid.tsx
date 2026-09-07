"use client";

import React, { useState, useMemo } from "react";
import { Search, Code2, Database, FileSpreadsheet, Eye } from "lucide-react";

export interface SheetColumn {
  name: string;
  type: string;
  null_pct: number;
  sample: string;
}

export interface SheetInfo {
  row_count: number;
  col_count: number;
  columns: SheetColumn[];
  preview: Record<string, any>[];
}

export interface SpreadsheetMetadata {
  file_name: string;
  file_size_bytes: number;
  total_rows: number;
  sheet_names: string[];
  sheets: Record<string, SheetInfo>;
  data_dictionary: string;
  estimated_token_count: number;
  suggested_queries?: string[];
}

interface SpreadsheetGridProps {
  metadata: SpreadsheetMetadata | null;
  activeSheet: string;
  onSelectSheet: (name: string) => void;
}

export function SpreadsheetGrid({ metadata, activeSheet, onSelectSheet }: SpreadsheetGridProps) {
  const [showDictionary, setShowDictionary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentSheet = metadata?.sheets[activeSheet] || metadata?.sheets[metadata?.sheet_names[0] || ""];
  const columns = currentSheet?.columns || [];
  const previewRows = currentSheet?.preview || [];

  // Filter preview rows by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return previewRows;
    const q = searchQuery.toLowerCase();
    return previewRows.filter((row) =>
      Object.values(row).some((val) => String(val ?? "").toLowerCase().includes(q))
    );
  }, [previewRows, searchQuery]);

  if (!metadata) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-[#e5e7eb] rounded-xl bg-white shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-[#f3f4f6] flex items-center justify-center mb-3">
          <FileSpreadsheet className="w-6 h-6 text-[#6b7280]" />
        </div>
        <h3 className="text-sm font-semibold text-[#101010] mb-1">No Active Spreadsheet</h3>
        <p className="text-xs text-[#6b7280] max-w-xs leading-relaxed mb-4">
          Drop an Excel or CSV file or load the 50,000-row enterprise benchmark to begin local analytical queries.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Top Toolbar: File Summary & Controls */}
      <div className="px-5 py-3 border-b border-[#e5e7eb] bg-[#fafafa] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#e5e7eb] flex items-center justify-center text-[#101010] shadow-2xs">
            <FileSpreadsheet className="w-4 h-4 text-[#101010]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-[#101010] tracking-tight">{metadata.file_name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-[#6b7280] font-mono border border-[#e5e7eb]">
                {(metadata.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            <p className="text-[11px] text-[#6b7280]">
              <span className="text-[#101010] font-medium tabular-nums">{metadata.total_rows.toLocaleString()}</span> rows across{" "}
              <span>{metadata.sheet_names.length} sheet{metadata.sheet_names.length !== 1 ? "s" : ""}</span>
            </p>
          </div>
        </div>

        {/* Schema Virtualization Badge & Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#e5e7eb] text-[11px] text-[#6b7280] shadow-2xs">
            <span>Context Virtualization:</span>
            <span className="text-[#101010] font-semibold font-mono tabular-nums">{metadata.estimated_token_count} tokens</span>
            <span className="text-gray-400">(&lt;0.05%)</span>
          </div>

          <button
            onClick={() => setShowDictionary(!showDictionary)}
            className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
              showDictionary
                ? "bg-[#101010] text-white border-[#101010]"
                : "cal-button-secondary"
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>{showDictionary ? "Hide Schema" : "Inspect Schema"}</span>
          </button>
        </div>
      </div>

      {/* Sheet Tabs & Search (Cal.com Segmented Control) */}
      <div className="px-5 py-2.5 border-b border-[#e5e7eb] bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="cal-tabs-container">
          {metadata.sheet_names.map((name) => {
            const isActive = name === activeSheet;
            const count = metadata.sheets[name]?.row_count || 0;
            return (
              <button
                key={name}
                onClick={() => {
                  onSelectSheet(name);
                  setSearchQuery("");
                }}
                className={`cal-tab-item cursor-pointer flex items-center gap-1.5 ${isActive ? "active" : ""}`}
              >
                <span>{name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                    isActive ? "bg-[#f3f4f6] text-[#101010]" : "text-[#9ca3af]"
                  }`}
                >
                  {count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Inline Search Filter */}
        <div className="relative flex items-center w-56">
          <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records..."
            className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg pl-8 pr-3 py-1 text-xs text-[#18181b] placeholder-[#9ca3af] focus:outline-none focus:border-[#101010] focus:bg-white transition-all font-sans"
          />
        </div>
      </div>

      {/* Schema Drawer (Cal.com Slide-Down) */}
      {showDictionary && (
        <div className="p-4 bg-[#f9fafb] border-b border-[#e5e7eb] text-xs font-mono max-h-52 overflow-y-auto shrink-0 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#101010] font-sans flex items-center gap-1.5">
              Compact Statistical Data Dictionary
            </span>
            <span className="text-[10px] text-[#6b7280] font-sans">
              Only this schema dictionary is sent to the LLM (zero raw row exposure)
            </span>
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed text-[#374151] bg-white p-3 rounded-lg border border-[#e5e7eb] text-[11px] shadow-2xs">
            {metadata.data_dictionary}
          </pre>
        </div>
      )}

      {/* Column Types Ribbon */}
      <div className="px-5 py-2 bg-[#fafafa] border-b border-[#e5e7eb] flex items-center gap-2 overflow-x-auto text-[10px] shrink-0">
        <span className="text-[#6b7280] font-medium shrink-0 uppercase tracking-wider text-[9px]">
          Columns ({columns.length}):
        </span>
        {columns.map((col) => (
          <div
            key={col.name}
            className="px-2 py-0.5 rounded-md bg-white border border-[#e5e7eb] text-[#374151] shrink-0 flex items-center gap-1.5 shadow-2xs"
          >
            <span className="font-medium text-[#18181b]">{col.name}</span>
            <span className="font-mono text-[#0099ff] text-[9px]">{col.type}</span>
          </div>
        ))}
      </div>

      {/* Data Table Grid */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#f9fafb] text-[#6b7280] uppercase tracking-wider sticky top-0 z-10 border-b border-[#e5e7eb] text-[10px] font-semibold">
            <tr>
              <th className="p-2.5 w-10 text-[#9ca3af] text-center font-mono border-r border-[#e5e7eb]">#</th>
              {columns.map((col) => (
                <th key={col.name} className="p-2.5 border-r border-[#e5e7eb] font-semibold text-[#374151] whitespace-nowrap">
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f6] text-[11px]">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-[#9ca3af] italic">
                  No records matching "{searchQuery}".
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="p-2 text-center text-[#9ca3af] border-r border-[#e5e7eb] text-[10px] select-none font-mono">
                    {idx + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col.name];
                    const isNumber = !isNaN(Number(val)) && val !== null && val !== "";
                    return (
                      <td
                        key={col.name}
                        className={`p-2 border-r border-[#e5e7eb] whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px] ${
                          isNumber
                            ? "text-right tabular-nums text-[#111827] font-medium font-mono"
                            : "text-left text-[#374151]"
                        }`}
                      >
                        {val !== null && val !== undefined ? String(val) : <span className="text-[#9ca3af] italic">null</span>}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-5 py-2.5 bg-[#fafafa] border-t border-[#e5e7eb] text-xs text-[#6b7280] flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1.5 text-[11px]">
          Showing <strong className="text-[#101010] tabular-nums font-medium">{filteredRows.length}</strong> of{" "}
          <strong className="text-[#101010] tabular-nums font-medium">{currentSheet?.row_count?.toLocaleString()}</strong> records
        </span>
        <span className="flex items-center gap-1.5 text-[#10b981] font-mono text-[11px]">
          <Database className="w-3.5 h-3.5" /> DuckDB Table: <code className="text-[#101010] font-semibold">{activeSheet}</code>
        </span>
      </div>
    </div>
  );
}
