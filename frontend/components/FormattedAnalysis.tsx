"use client";

import React, { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  Lightbulb,
  ShieldCheck,
  Check,
  Copy,
  Zap,
  BarChart3,
  Layers,
  FileText,
  Lock,
  ArrowRight
} from "lucide-react";

interface FormattedAnalysisProps {
  text: string;
  queryResult?: {
    duration_ms: number;
    total_rows: number;
    total_cols: number;
    columns: string[];
    rows: Record<string, any>[];
  };
  durationMs?: number;
}

// Format numbers into human-readable currency or compact notations
export function formatValue(key: string, val: any): string {
  if (val === null || val === undefined) return "N/A";
  if (typeof val === "number") {
    const k = key.toLowerCase();
    if (k.includes("revenue") || k.includes("sales") || k.includes("profit") || k.includes("cost") || k.includes("price") || k.includes("amount")) {
      if (Math.abs(val) >= 1_000_000_000) {
        return `$${(val / 1_000_000_000).toFixed(2)}B`;
      } else if (Math.abs(val) >= 1_000_000) {
        return `$${(val / 1_000_000).toFixed(2)}M`;
      } else if (Math.abs(val) >= 1_000) {
        return `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
      }
      return `$${val.toFixed(2)}`;
    }
    if (k.includes("pct") || k.includes("percent") || k.includes("margin") || k.includes("rate")) {
      return val > 1 ? `${val.toFixed(1)}%` : `${(val * 100).toFixed(1)}%`;
    }
    if (Number.isInteger(val)) {
      return val.toLocaleString();
    }
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(val);
}

export function FormattedAnalysis({ text, queryResult, durationMs }: FormattedAnalysisProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Derive top KPI cards if query results are available
  const kpis: { label: string; value: string; sub?: string }[] = [];
  if (queryResult && queryResult.rows && queryResult.rows.length > 0) {
    const firstRow = queryResult.rows[0];
    const keys = Object.keys(firstRow);

    // Look for dimension / primary category
    const catCol = keys.find(k => typeof firstRow[k] === "string" && !k.toLowerCase().includes("id"));
    // Look for numerical metrics
    const numCols = keys.filter(k => typeof firstRow[k] === "number");

    numCols.slice(0, 3).forEach(k => {
      kpis.push({
        label: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        value: formatValue(k, firstRow[k]),
        sub: catCol ? `${firstRow[catCol]}` : undefined
      });
    });
  }

  // Parse markdown into sections
  const sections = parseMarkdownSections(text);

  return (
    <div className="space-y-4">
      {/* Top Telemetry & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#10b981]/10 text-[#059669] font-medium border border-[#10b981]/20">
            <Lock className="w-3 h-3 text-[#10b981]" />
            <span>Air-Gapped Compute</span>
          </span>

          {durationMs !== undefined && durationMs > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>{durationMs.toFixed(1)}ms execution</span>
            </span>
          )}

          {queryResult && queryResult.total_rows > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono">
              <Layers className="w-3 h-3 text-blue-500" />
              <span>{queryResult.total_rows.toLocaleString()} rows</span>
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-gray-600 hover:text-gray-900 bg-white border border-[#e5e7eb] hover:bg-gray-50 transition-all cursor-pointer font-medium shadow-xs"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#10b981]" />
              <span className="text-[#059669]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-gray-400" />
              <span>Copy Report</span>
            </>
          )}
        </button>
      </div>

      {/* Top KPI Cards (if metrics exist) */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="p-3 bg-white border border-[#e5e7eb] rounded-xl shadow-xs hover:border-[#d1d5db] transition-colors"
            >
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 truncate">
                {kpi.label}
              </div>
              <div className="text-lg font-bold text-gray-900 mt-0.5 tracking-tight font-mono">
                {kpi.value}
              </div>
              {kpi.sub && (
                <div className="text-[11px] text-gray-500 mt-0.5 truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0099ff]"></span>
                  <span>Top: {kpi.sub}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Structured Sections */}
      <div className="space-y-3">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="p-4 bg-white border border-[#e5e7eb] rounded-xl shadow-xs hover:border-[#d1d5db] transition-colors"
          >
            {section.title && (
              <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-[#f3f4f6]">
                <SectionIcon title={section.title} />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900">
                  {section.title}
                </h4>
              </div>
            )}

            <div className="space-y-2 text-xs leading-relaxed text-gray-700">
              {section.items.map((item, itemIdx) => (
                <RenderItem key={itemIdx} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  if (t.includes("summary") || t.includes("overview")) {
    return <Sparkles className="w-3.5 h-3.5 text-[#0099ff]" />;
  }
  if (t.includes("takeaway") || t.includes("insight") || t.includes("finding") || t.includes("metric")) {
    return <TrendingUp className="w-3.5 h-3.5 text-[#10b981]" />;
  }
  if (t.includes("recommend") || t.includes("action") || t.includes("next step")) {
    return <Lightbulb className="w-3.5 h-3.5 text-amber-500" />;
  }
  if (t.includes("governance") || t.includes("audit") || t.includes("privacy") || t.includes("verified")) {
    return <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />;
  }
  return <FileText className="w-3.5 h-3.5 text-gray-500" />;
}

interface ParsedItem {
  type: "bullet" | "number" | "paragraph" | "callout";
  number?: string;
  key?: string;
  text: string;
}

interface Section {
  title?: string;
  items: ParsedItem[];
}

function parseMarkdownSections(raw: string): Section[] {
  if (!raw) return [];
  const lines = raw.split("\n");
  const sections: Section[] = [];
  let currentSection: Section = { items: [] };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Headings: ### Title or ## Title or # Title
    if (line.startsWith("#")) {
      const title = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
      if (currentSection.items.length > 0 || currentSection.title) {
        sections.push(currentSection);
      }
      currentSection = { title, items: [] };
      continue;
    }

    // Bullet points: - **Key**: text or - text or * text
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const content = line.substring(2).trim();
      // Check for bold key: **Key**: text or **Key** - text
      const keyMatch = content.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)$/);
      if (keyMatch) {
        currentSection.items.push({
          type: "bullet",
          key: keyMatch[1].trim(),
          text: keyMatch[2].trim()
        });
      } else {
        currentSection.items.push({
          type: "bullet",
          text: content
        });
      }
      continue;
    }

    // Numbered lists: 1. text or 2. **Key**: text
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const num = numMatch[1];
      const content = numMatch[2].trim();
      const keyMatch = content.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)$/);
      if (keyMatch) {
        currentSection.items.push({
          type: "number",
          number: num,
          key: keyMatch[1].trim(),
          text: keyMatch[2].trim()
        });
      } else {
        currentSection.items.push({
          type: "number",
          number: num,
          text: content
        });
      }
      continue;
    }

    // Normal paragraph
    currentSection.items.push({
      type: "paragraph",
      text: line
    });
  }

  if (currentSection.items.length > 0 || currentSection.title) {
    sections.push(currentSection);
  }

  return sections;
}

function RenderItem({ item }: { item: ParsedItem }) {
  if (item.type === "bullet") {
    return (
      <div className="flex items-start gap-2.5 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0099ff] mt-1.5 shrink-0" />
        <div className="flex-1 leading-relaxed">
          {item.key && (
            <span className="font-semibold text-gray-900 mr-1.5">
              {item.key}:
            </span>
          )}
          <FormatInlineText text={item.text} />
        </div>
      </div>
    );
  }

  if (item.type === "number") {
    return (
      <div className="flex items-start gap-2.5 py-0.5">
        <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-700 font-mono text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5 border border-gray-200">
          {item.number}
        </span>
        <div className="flex-1 leading-relaxed">
          {item.key && (
            <span className="font-semibold text-gray-900 mr-1.5">
              {item.key}:
            </span>
          )}
          <FormatInlineText text={item.text} />
        </div>
      </div>
    );
  }

  return (
    <p className="leading-relaxed text-gray-700">
      <FormatInlineText text={item.text} />
    </p>
  );
}

// Formats inline markdown like `code`, **bold**, and numerical values
function FormatInlineText({ text }: { text: string }) {
  if (!text) return null;

  // Split by inline code `foo` and bold **foo**
  // Tokenizer pattern: (`[^`]+`|\*\*[^*]+\*\*)
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return (
    <>
      {tokens.map((token, i) => {
        if (!token) return null;
        if (token.startsWith("`") && token.endsWith("`")) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono text-[11px] border border-gray-200"
            >
              {token.slice(1, -1)}
            </code>
          );
        }
        if (token.startsWith("**") && token.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-gray-900">
              {token.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{token}</span>;
      })}
    </>
  );
}
