"use client";

import React from "react";
import { Sparkles, UploadCloud, RefreshCw, Database, Home, ArrowLeft } from "lucide-react";
import { NumeraLogo } from "./NumeraLogo";

interface HeaderProps {
  onLoadSample: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNavigateHome?: () => void;
  isLoading: boolean;
  activeFileName?: string;
  totalRows?: number;
}

export function Header({
  onLoadSample,
  onFileUpload,
  onNavigateHome,
  isLoading,
  activeFileName,
  totalRows,
}: HeaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [llmStatus, setLlmStatus] = React.useState<{
    ollama_connected: boolean;
    active_model: string | null;
    available_models: string[];
  } | null>(null);
  const [showSetupModal, setShowSetupModal] = React.useState(false);
  const [copiedCmd, setCopiedCmd] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("popover") === "ollama") {
        setShowSetupModal(true);
      }
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/llm-status");
        if (res.ok) {
          const data = await res.json();
          setLlmStatus(data);
        }
      } catch (e) {}
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  const copyOllamaCmd = () => {
    navigator.clipboard.writeText("ollama run qwen2.5:3b");
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <header className="w-full border-b border-[#e5e7eb] bg-white sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="max-w-[1760px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
        {/* Cal.com Brand & Breadcrumb */}
        <div className="flex items-center gap-3">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#101010] hover:bg-[#f3f4f6] transition-colors cursor-pointer mr-1"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <NumeraLogo size={28} />

          <div className="flex items-center gap-2 text-sm font-semibold text-[#101010] tracking-tight">
            <span>Numera</span>
            <span className="text-gray-300 font-normal">/</span>
            {activeFileName ? (
              <div className="flex items-center gap-1.5 font-normal text-xs text-[#4b5563]">
                <span className="font-medium text-[#101010]">{activeFileName}</span>
                {totalRows !== undefined && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#6b7280] font-mono border border-[#e5e7eb]">
                    {totalRows.toLocaleString()} rows
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-[#6b7280] font-normal">Analytics Workspace</span>
            )}
          </div>
        </div>

        {/* Center: Interactive Cal.com Ollama & Privacy Status Badge */}
        <div className="relative">
          <button
            onClick={() => setShowSetupModal(!showSetupModal)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f9fafb] hover:bg-[#f3f4f6] border border-[#e5e7eb] hover:border-[#d1d5db] text-xs transition-all cursor-pointer shadow-2xs"
            title="Click to view local AI model & environment status"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                llmStatus?.ollama_connected ? "bg-[#10b981] animate-pulse" : "bg-[#f59e0b]"
              }`}
            />
            <span className="text-[#18181b] font-medium text-[11px]">
              {llmStatus?.ollama_connected
                ? `Ollama: ${llmStatus.active_model}`
                : "Air-Gapped Offline Engine"}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-[#6b7280] text-[11px] font-mono">
              {llmStatus?.ollama_connected ? "Local GPU" : "Zero Cloud Uploads"}
            </span>
          </button>

          {/* Popover Card */}
          {showSetupModal && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-lg z-50 text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#f3f4f6]">
                <span className="font-semibold text-[#101010] text-[12px]">Local AI Environment</span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    llmStatus?.ollama_connected
                      ? "bg-[#10b981]/10 text-[#059669] border border-[#10b981]/20"
                      : "bg-[#f59e0b]/10 text-[#d97706] border border-[#f59e0b]/20"
                  }`}
                >
                  {llmStatus?.ollama_connected ? "Connected" : "Offline Engine Active"}
                </span>
              </div>

              {llmStatus?.ollama_connected ? (
                <div className="space-y-2 text-[#4b5563]">
                  <p className="leading-relaxed">
                    Connected to local Ollama on <code className="bg-[#f3f4f6] px-1 py-0.5 rounded text-[11px]">127.0.0.1:11434</code>.
                  </p>
                  <div className="p-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
                    <span className="text-[10px] uppercase tracking-wider text-[#9ca3af] font-semibold block mb-1">
                      Active Model
                    </span>
                    <span className="font-mono text-[11px] text-[#101010] font-medium">
                      {llmStatus.active_model}
                    </span>
                  </div>
                  {llmStatus.available_models.length > 1 && (
                    <p className="text-[11px] text-[#6b7280]">
                      Available: {llmStatus.available_models.join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5 text-[#4b5563]">
                  <p className="leading-relaxed">
                    Numera is currently using its <strong>Built-in Offline Engine</strong> (sub-20ms DuckDB OLAP with zero setup).
                  </p>
                  <p className="text-[11px] text-[#6b7280]">
                    To connect local generative AI, run this 1 command in your terminal:
                  </p>
                  <div className="flex items-center justify-between p-2 bg-[#101010] text-[#0099ff] font-mono text-[11px] rounded-lg">
                    <span>ollama run qwen2.5:3b</span>
                    <button
                      onClick={copyOllamaCmd}
                      className="text-white hover:text-[#0099ff] text-[10px] uppercase font-bold ml-2 cursor-pointer transition-colors"
                    >
                      {copiedCmd ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 mt-3 border-t border-[#f3f4f6] flex justify-end">
                <button
                  onClick={() => setShowSetupModal(false)}
                  className="text-[11px] text-[#6b7280] hover:text-[#101010] font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            accept=".xlsx,.xls,.csv,.tsv,.txt"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="cal-button-secondary px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#6b7280]" />
            <span>Upload File</span>
          </button>

          <button
            onClick={onLoadSample}
            disabled={isLoading}
            className="cal-button-primary px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#0099ff]" />
            )}
            <span>50k Benchmark</span>
          </button>
        </div>
      </div>
    </header>
  );
}
