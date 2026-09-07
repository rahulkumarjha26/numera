"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Shield,
  Zap,
  Lock,
  Cpu,
  Database,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Layers,
  Terminal,
  Server,
  Copy,
  Check,
  ExternalLink
} from "lucide-react";
import { NumeraLogo } from "./NumeraLogo";

interface LandingPageProps {
  onLoadSample: () => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  onOpenWorkspace?: () => void;
  hasActiveSession?: boolean;
}

export function LandingPage({
  onLoadSample,
  onFileUpload,
  isLoading,
  onOpenWorkspace,
  hasActiveSession
}: LandingPageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [setupTab, setSetupTab] = useState<"quickstart" | "ollama" | "offline">("quickstart");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const setup = params.get("setup");
      if (setup === "ollama" || setup === "quickstart" || setup === "offline") {
        setSetupTab(setup);
        setTimeout(() => {
          document.getElementById("setup-guide")?.scrollIntoView({ behavior: "instant", block: "center" });
        }, 150);
      }
    }
  }, []);

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#18181b] flex flex-col selection:bg-[#101010] selection:text-white">
      {/* Cal.com Minimalist Top Navigation */}
      <header className="w-full border-b border-[#e5e7eb] bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1240px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NumeraLogo size={30} />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[15px] tracking-tight text-[#101010]">Numera</span>
              <span className="text-gray-300 mx-1 hidden sm:inline">/</span>
              <span className="text-xs text-[#6b7280] hidden sm:inline font-medium">
                Air-Gapped Tabular Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => document.getElementById("setup-guide")?.scrollIntoView({ behavior: "smooth" })}
              className="text-xs font-medium text-[#6b7280] hover:text-[#101010] transition-colors cursor-pointer hidden sm:inline"
            >
              Setup Guide
            </button>

            {hasActiveSession && onOpenWorkspace && (
              <button
                onClick={onOpenWorkspace}
                className="cal-button-secondary px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer"
              >
                Go to Active Workspace →
              </button>
            )}

            <button
              onClick={onLoadSample}
              disabled={isLoading}
              className="cal-button-primary px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[#0099ff]" />
              )}
              <span>Load 50k Benchmark</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-[1140px] w-full mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center">
        {/* Air-Gapped Security Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e5e7eb] shadow-2xs mb-8">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          <span className="text-xs font-semibold text-[#18181b] tracking-tight">
            100% Air-Gapped Local Compute
          </span>
          <span className="text-gray-300">•</span>
          <span className="text-xs text-[#6b7280]">Zero 3rd-Party Cloud Transmission</span>
        </div>

        {/* Main Badass Headline */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#101010] max-w-4xl leading-[1.12]">
          Your spreadsheets contain company secrets.{" "}
          <span className="text-[#6b7280] font-medium">
            Stop feeding them to public AI clouds.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-[#6b7280] max-w-2xl font-normal leading-relaxed">
          Numera runs 100% locally on your device. Analyze and manipulate massive{" "}
          <span className="text-[#101010] font-semibold">500,000+ row Excel & CSV files</span> in{" "}
          <span className="text-[#101010] font-semibold">sub-20ms</span> with embedded DuckDB OLAP and
          private LLMs. No cloud uploads. No data leaks. Exact math.
        </p>

        {/* Massive Interactive Cal.com Drag-and-Drop Dropzone */}
        <div className="w-full max-w-2xl mt-12">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".xlsx,.xls,.csv,.tsv,.txt"
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center bg-white shadow-sm group ${
              isDragging
                ? "border-[#101010] bg-[#f3f4f6] scale-[1.01]"
                : "border-[#d1d5db] hover:border-[#101010] hover:bg-[#fafafa]"
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#f3f4f6] group-hover:bg-[#e5e7eb] flex items-center justify-center mb-4 transition-colors">
              <UploadCloud className="w-7 h-7 text-[#101010]" />
            </div>

            <h3 className="text-base font-semibold text-[#101010] mb-1">
              Drag and drop your spreadsheet here, or{" "}
              <span className="text-[#0099ff] underline underline-offset-4">browse files</span>
            </h3>

            <p className="text-xs text-[#6b7280] mb-5">
              Supports .xlsx, .xls, .csv, .tsv up to millions of records (tested on 579,000+ rows)
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-[#f3f4f6] text-[11px] font-mono text-[#4b5563] border border-[#e5e7eb]">
                .xlsx (Excel)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#f3f4f6] text-[11px] font-mono text-[#4b5563] border border-[#e5e7eb]">
                .csv (Delimited)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#f3f4f6] text-[11px] font-mono text-[#4b5563] border border-[#e5e7eb]">
                .tsv / .txt
              </span>
            </div>
          </div>

          {/* Quick Demo Option */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-xs text-[#6b7280]">Don't have a file ready?</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLoadSample();
              }}
              disabled={isLoading}
              className="text-xs font-semibold text-[#101010] hover:text-[#0099ff] flex items-center gap-1 cursor-pointer transition-colors"
            >
              Test with 50,000-row Enterprise Sales Dataset <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Interactive Cal.com Setup & Quickstart Guide */}
        <section id="setup-guide" className="w-full mt-20 text-left scroll-mt-24">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3f4f6] text-[#6b7280] text-[11px] font-medium border border-[#e5e7eb] mb-3">
              <Terminal className="w-3.5 h-3.5 text-[#101010]" />
              <span>Zero-Friction Local Deployment</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101010]">
              Get Up and Running in Under 60 Seconds
            </h2>
            <p className="text-sm text-[#6b7280] mt-2 max-w-xl mx-auto">
              Choose your preferred setup method. Numera is designed with auto-discovery so you never have to configure ports or API keys.
            </p>
          </div>

          <div className="cal-card bg-white p-6 sm:p-8 max-w-3xl mx-auto shadow-sm">
            {/* Cal.com Segmented Mode Switcher */}
            <div className="cal-tabs-container p-1 rounded-xl mb-6 flex items-center gap-1">
              <button
                onClick={() => setSetupTab("quickstart")}
                className={`cal-tab-item flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  setupTab === "quickstart" ? "active text-[#101010] shadow-2xs" : "text-[#6b7280]"
                }`}
              >
                1. One-Click Launcher (start.sh)
              </button>
              <button
                onClick={() => setSetupTab("ollama")}
                className={`cal-tab-item flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  setupTab === "ollama" ? "active text-[#101010] shadow-2xs" : "text-[#6b7280]"
                }`}
              >
                2. Connect Local Ollama
              </button>
              <button
                onClick={() => setSetupTab("offline")}
                className={`cal-tab-item flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  setupTab === "offline" ? "active text-[#101010] shadow-2xs" : "text-[#6b7280]"
                }`}
              >
                3. Zero-Install Offline Engine
              </button>
            </div>

            {/* Tab 1: One-Click Launcher */}
            {setupTab === "quickstart" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#101010]">
                    Clone and run with a single command:
                  </span>
                  <span className="text-[11px] text-[#059669] font-medium bg-[#10b981]/10 px-2.5 py-0.5 rounded-full border border-[#10b981]/20">
                    Recommended
                  </span>
                </div>

                <div className="relative group">
                  <pre className="p-4 bg-[#101010] text-white font-mono text-xs rounded-xl overflow-x-auto selection:bg-white/20">
                    <span className="text-[#6b7280]"># Clone repository & launch with 1 command</span>
                    {"\n"}
                    <span className="text-[#0099ff] font-semibold">git clone https://github.com/rahulkumarjha26/numera.git</span>
                    {"\n"}
                    <span className="text-[#0099ff] font-semibold">cd numera</span>
                    {"\n"}
                    <span className="text-[#0099ff] font-semibold">./start.sh</span>
                  </pre>
                  <button
                    onClick={() => copyCode("git clone https://github.com/rahulkumarjha26/numera.git && cd numera && ./start.sh", "start")}
                    className="absolute top-3 right-3 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedCode === "start" ? (
                      <>
                        <Check className="w-3 h-3 text-[#10b981]" />
                        <span className="text-[#10b981]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-[#4b5563]">
                  <div className="p-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
                    <span className="font-semibold text-[#101010] block mb-0.5">1. Auto-Venv</span>
                    <span className="text-[11px] text-[#6b7280]">Creates virtualenv and installs DuckDB + LangGraph.</span>
                  </div>
                  <div className="p-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
                    <span className="font-semibold text-[#101010] block mb-0.5">2. Ollama Probe</span>
                    <span className="text-[11px] text-[#6b7280]">Detects local models on port 11434 automatically.</span>
                  </div>
                  <div className="p-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
                    <span className="font-semibold text-[#101010] block mb-0.5">3. Auto-Open</span>
                    <span className="text-[11px] text-[#6b7280]">Opens http://localhost:3000 in your default browser.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Ollama Setup */}
            {setupTab === "ollama" && (
              <div className="space-y-4">
                <p className="text-xs text-[#4b5563] leading-relaxed">
                  Numera automatically probes <code className="font-mono bg-[#f3f4f6] px-1.5 py-0.5 rounded text-[#101010]">127.0.0.1:11434</code> on startup. To connect full generative reasoning on Apple Silicon:
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#101010] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-[#101010]">Install Ollama</span>
                        <a
                          href="https://ollama.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#0099ff] hover:underline flex items-center gap-1"
                        >
                          ollama.com <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <code className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-[#e5e7eb] text-[#374151] inline-block">
                        brew install ollama
                      </code>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#101010] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-xs text-[#101010] block mb-1">Run Recommended Coding Model</span>
                      <div className="flex items-center justify-between bg-[#101010] text-white p-2.5 rounded-lg font-mono text-xs">
                        <span className="text-[#0099ff]">ollama run qwen2.5:3b</span>
                        <button
                          onClick={() => copyCode("ollama run qwen2.5:3b", "ollama")}
                          className="text-[10px] uppercase font-bold text-white hover:text-[#0099ff] cursor-pointer ml-3"
                        >
                          {copiedCode === "ollama" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <span className="text-[10px] text-[#6b7280] mt-1.5 block">
                        Also compatible with: <code>llama3.2</code>, <code>qwen2.5:7b</code>, <code>mistral</code>, <code>deepseek-coder</code>.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Offline Engine */}
            {setupTab === "offline" && (
              <div className="space-y-4">
                <div className="p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-xs space-y-2 text-[#4b5563]">
                  <span className="font-semibold text-[#101010] text-sm block">
                    No Ollama? No API Keys? No Problem.
                  </span>
                  <p className="leading-relaxed">
                    Numera includes an integrated <strong>Deterministic Schema-Driven Heuristic Engine</strong>. It parses any uploaded spreadsheet into an in-memory DuckDB OLAP database, executes lightning-fast aggregations, generates charts, and exports Excel files without requiring any LLM to be installed.
                  </p>
                  <p className="text-[11px] text-[#6b7280]">
                    Simply click <strong>"Load 50k Benchmark"</strong> or drag any Excel file onto the dropzone above to test it immediately.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Architecture Comparison Table (Cal.com Grid) */}
        <section className="w-full mt-24 text-left">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-[#101010]">
              Why Local In-Memory OLAP Beats Public Cloud AI
            </h2>
            <p className="text-sm text-[#6b7280] mt-2">
              How Numera solves the fundamental security & accuracy flaws of traditional LLMs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1: Public Cloud AI */}
            <div className="cal-card p-6 flex flex-col bg-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h3 className="font-semibold text-sm text-[#101010]">Public Cloud AI</h3>
              </div>
              <p className="text-xs text-[#6b7280] mb-5">
                ChatGPT, Microsoft Copilot, Claude web uploads.
              </p>
              <ul className="space-y-3.5 text-xs text-[#4b5563] flex-1">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Data Leakage:</strong> Uploads entire confidential customer & sales rows to external data centers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Context Overflow:</strong> Crashes or truncates spreadsheets larger than ~5,000 rows.</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Hallucinated Math:</strong> Generates probabilistic approximations instead of exact decimal calculations.</span>
                </li>
              </ul>
            </div>

            {/* Column 2: Vector RAG */}
            <div className="cal-card p-6 flex flex-col bg-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="font-semibold text-sm text-[#101010]">Vector RAG Systems</h3>
              </div>
              <p className="text-xs text-[#6b7280] mb-5">
                Chunking rows into vector embedding databases.
              </p>
              <ul className="space-y-3.5 text-xs text-[#4b5563] flex-1">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Broken Aggregations:</strong> Fundamentally incapable of calculating sums, averages, or profit margins.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Destructive Chunking:</strong> Loses multi-sheet relations (e.g. Products to Transactions joins).</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Heavy Indexing:</strong> Takes minutes or hours to embed million-row spreadsheets.</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Numera */}
            <div className="cal-card p-6 flex flex-col bg-[#ffffff] border-2 border-[#101010] shadow-md relative overflow-hidden">
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#101010] text-white text-[10px] font-semibold">
                Our Architecture
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                <h3 className="font-semibold text-sm text-[#101010]">Numera</h3>
              </div>
              <p className="text-xs text-[#6b7280] mb-5">
                Air-Gapped In-Memory DuckDB OLAP + LangGraph.
              </p>
              <ul className="space-y-3.5 text-xs text-[#18181b] font-medium flex-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                  <span><strong>100% Air-Gapped:</strong> Raw records live strictly in local RAM. Zero data sent to cloud servers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                  <span><strong>Virtual Schema Induction:</strong> Condenses 500k rows into a 240-token statistical dictionary.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                  <span><strong>Deterministic C++ Math:</strong> DuckDB executes relational SQL queries in sub-20ms. Exact to 2 decimals.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                  <span><strong>Local LLM Native:</strong> Connects to local Ollama (Qwen, Llama) with automated self-healing loops.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Feature Grid (Cal.com 4-Card Layout) */}
        <section className="w-full mt-24 text-left">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-[#101010]">
              Engineered for Enterprise Tabular Demands
            </h2>
            <p className="text-sm text-[#6b7280] mt-2">
              Every component crafted for speed, privacy, and mathematical certainty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="cal-card p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#f3f4f6] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-[#101010]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#101010] mb-1">Sub-20ms In-Memory OLAP</h3>
                <p className="text-xs text-[#6b7280] leading-relaxed">
                  Powered by vectorized C++ DuckDB. Evaluates complex joins, window functions, and multi-column aggregations on 500,000+ records in single-digit milliseconds.
                </p>
              </div>
            </div>

            <div className="cal-card p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#f3f4f6] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-[#101010]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#101010] mb-1">Virtual Schema Induction</h3>
                <p className="text-xs text-[#6b7280] leading-relaxed">
                  Instead of stuffing entire tables into context windows, Numera profiles column distributions into a compact 240-token schema dictionary with zero token bloat.
                </p>
              </div>
            </div>

            <div className="cal-card p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#f3f4f6] flex items-center justify-center shrink-0">
                <Terminal className="w-5 h-5 text-[#101010]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#101010] mb-1">LangGraph Self-Healing Loop</h3>
                <p className="text-xs text-[#6b7280] leading-relaxed">
                  A 5-agent state machine orchestrates intent classification, SQL synthesis, runtime execution, and reflection. Syntax errors are automatically inspected and corrected.
                </p>
              </div>
            </div>

            <div className="cal-card p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#f3f4f6] flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-[#101010]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#101010] mb-1">Spreadsheet Transformation & Export</h3>
                <p className="text-xs text-[#6b7280] leading-relaxed">
                  Perform mutating operations (e.g. adding margin tiers, calculating discounts) and immediately export clean, multi-sheet .xlsx or .csv files with a single click.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="mt-20 py-12 px-8 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm w-full flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div>
            <h3 className="text-lg font-bold text-[#101010]">Ready to test your confidential spreadsheets?</h3>
            <p className="text-xs text-[#6b7280] mt-1">Upload any Excel or CSV file locally. No registration or credit card required.</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="cal-button-primary px-6 py-3 rounded-full text-xs font-semibold shrink-0 cursor-pointer shadow-sm flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Spreadsheet</span>
          </button>
        </div>
      </main>

      {/* Minimal Cal.com Footer */}
      <footer className="w-full border-t border-[#e5e7eb] bg-white py-6 text-center text-xs text-[#6b7280]">
        <div className="max-w-[1240px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <NumeraLogo size={20} />
            <span className="font-semibold text-[#101010]">Numera</span>
            <span>•</span>
            <span>Local Tabular Inference Engine</span>
          </div>
          <div className="flex items-center gap-4 text-[#6b7280]">
            <span>Air-Gapped DuckDB C++ Core</span>
            <span>•</span>
            <span>LangGraph Multi-Agent Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
