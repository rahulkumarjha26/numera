"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Terminal,
  BarChart2,
  Table as TableIcon,
  Download,
  Copy,
  Check,
  Zap,
  Sparkles,
  FileSpreadsheet,
  ArrowRight
} from "lucide-react";
import confetti from "canvas-confetti";
import { AgentTimeline, AgentStep } from "./AgentTimeline";
import { DynamicChart, ChartSpec } from "./DynamicChart";

export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  steps?: AgentStep[];
  generated_sql?: string;
  transformation_sqls?: string[];
  query_result?: {
    duration_ms: number;
    total_rows: number;
    total_cols: number;
    columns: string[];
    rows: Record<string, any>[];
  };
  chart_spec?: ChartSpec;
  download_url?: string;
  modified_file?: {
    modified_file_name: string;
    file_size_mb: number;
    duration_ms: number;
  };
}

interface InteractiveChatProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isExecuting: boolean;
  activeSteps: AgentStep[];
  hasLoadedSpreadsheet: boolean;
  suggestedQueries?: string[];
}

const DEFAULT_PROMPTS = [
  "What is the total revenue and net profit by sales channel?",
  "Which product category has the highest target margin?",
  "What is the sales performance across different states?",
  "Add a new column margin_tier and export a modified spreadsheet"
];

export function InteractiveChat({
  messages,
  onSendMessage,
  isExecuting,
  activeSteps,
  hasLoadedSpreadsheet,
  suggestedQueries,
}: InteractiveChatProps) {
  const [inputQuery, setInputQuery] = useState("");
  const [copiedSqlId, setCopiedSqlId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, "analysis" | "chart" | "sql" | "table">>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activePrompts = suggestedQueries && suggestedQueries.length > 0 ? suggestedQueries : DEFAULT_PROMPTS;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeSteps]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isExecuting || !hasLoadedSpreadsheet) return;
    onSendMessage(inputQuery.trim());
    setInputQuery("");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSqlId(id);
    setTimeout(() => setCopiedSqlId(null), 2000);
  };

  const handleDownload = (downloadUrl: string) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });
    window.open(`http://localhost:8000${downloadUrl}`, "_blank");
  };

  return (
    <div className="flex flex-col h-full bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Console Header */}
      <div className="px-5 py-3 border-b border-[#e5e7eb] bg-[#fafafa] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#101010]" />
          <h3 className="font-semibold text-xs text-[#101010] tracking-tight">Agent Inference Console</h3>
        </div>
        <span className="text-[10px] font-mono text-[#10b981] px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          Air-Gapped Ollama (qwen2.5)
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-white">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#6b7280]">
            <div className="w-12 h-12 rounded-xl bg-[#f3f4f6] flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-[#101010]" />
            </div>
            <h4 className="font-semibold text-[#101010] text-sm mb-1">Local Natural Language Inference</h4>
            <p className="text-xs text-[#6b7280] max-w-xs leading-relaxed mb-6">
              Query massive tables locally. Numera compiles natural language into C++ DuckDB SQL executed in sub-20ms.
            </p>

            {/* Quick Prompt Cards */}
            <div className="w-full max-w-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-[#9ca3af] tracking-wider">
                  Suggested Queries:
                </span>
                {suggestedQueries && suggestedQueries.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#0099ff] bg-[#0099ff]/5 px-2 py-0.5 rounded-full border border-[#0099ff]/15">
                    <Sparkles className="w-2.5 h-2.5" /> Tailored to schema
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {activePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    disabled={!hasLoadedSpreadsheet || isExecuting}
                    onClick={() => onSendMessage(prompt)}
                    className="w-full text-left p-2.5 text-xs text-[#374151] hover:text-[#101010] bg-white hover:bg-[#f9fafb] border border-[#e5e7eb] hover:border-[#d1d5db] rounded-lg flex items-center justify-between transition-all cursor-pointer group disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <span>{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9ca3af] group-hover:text-[#101010] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === "user";
            const currentTab = activeTab[msg.id] || "analysis";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full`}
              >
                {isUser ? (
                  <div className="cal-button-primary rounded-xl px-4 py-2.5 max-w-lg text-xs font-medium shadow-xs">
                    {msg.text}
                  </div>
                ) : (
                  <div className="w-full bg-white border border-[#e5e7eb] rounded-xl p-4 text-xs shadow-2xs">
                    {/* LangGraph Step Timeline */}
                    {msg.steps && msg.steps.length > 0 && (
                      <AgentTimeline steps={msg.steps} isExecuting={false} />
                    )}

                    {/* Cal.com Segmented View Switcher */}
                    <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-2.5 mb-3">
                      <div className="cal-tabs-container">
                        <button
                          onClick={() => setActiveTab({ ...activeTab, [msg.id]: "analysis" })}
                          className={`cal-tab-item cursor-pointer flex items-center gap-1.5 ${
                            currentTab === "analysis" ? "active" : ""
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#0099ff]" />
                          <span>Analysis</span>
                        </button>

                        {msg.chart_spec && (
                          <button
                            onClick={() => setActiveTab({ ...activeTab, [msg.id]: "chart" })}
                            className={`cal-tab-item cursor-pointer flex items-center gap-1.5 ${
                              currentTab === "chart" ? "active" : ""
                            }`}
                          >
                            <BarChart2 className="w-3.5 h-3.5 text-[#101010]" />
                            <span>Visuals</span>
                          </button>
                        )}

                        {msg.generated_sql && (
                          <button
                            onClick={() => setActiveTab({ ...activeTab, [msg.id]: "sql" })}
                            className={`cal-tab-item cursor-pointer flex items-center gap-1.5 ${
                              currentTab === "sql" ? "active" : ""
                            }`}
                          >
                            <Terminal className="w-3.5 h-3.5 text-[#101010]" />
                            <span>SQL Code</span>
                          </button>
                        )}

                        {msg.query_result && msg.query_result.rows.length > 0 && (
                          <button
                            onClick={() => setActiveTab({ ...activeTab, [msg.id]: "table" })}
                            className={`cal-tab-item cursor-pointer flex items-center gap-1.5 ${
                              currentTab === "table" ? "active" : ""
                            }`}
                          >
                            <TableIcon className="w-3.5 h-3.5 text-[#101010]" />
                            <span>Table ({msg.query_result.total_rows})</span>
                          </button>
                        )}
                      </div>

                      {/* Transformation Download Action */}
                      {msg.download_url && msg.modified_file && (
                        <button
                          onClick={() => handleDownload(msg.download_url!)}
                          className="cal-button-primary px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Excel ({msg.modified_file.file_size_mb} MB)</span>
                        </button>
                      )}
                    </div>

                    {/* Tab 1: Executive Summary */}
                    {currentTab === "analysis" && (
                      <div className="prose prose-sm max-w-none text-[#374151] leading-relaxed">
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      </div>
                    )}

                    {/* Tab 2: Chart View */}
                    {currentTab === "chart" && msg.chart_spec && (
                      <div className="p-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl">
                        <DynamicChart spec={msg.chart_spec} />
                      </div>
                    )}

                    {/* Tab 3: Generated SQL Code */}
                    {currentTab === "sql" && (
                      <div className="relative font-mono text-xs bg-[#18181b] border border-gray-800 rounded-lg p-3 text-gray-200 shadow-inner">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-2">
                          <span className="text-[10px] text-gray-400 font-sans font-medium">DuckDB In-Memory OLAP</span>
                          <button
                            onClick={() => copyToClipboard(msg.generated_sql || "", msg.id)}
                            className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedSqlId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-[#10b981]" />
                                <span className="text-[#10b981]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy SQL</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap overflow-x-auto text-[#0099ff]">
                          {msg.generated_sql}
                        </pre>
                      </div>
                    )}

                    {/* Tab 4: Raw Query Output Table */}
                    {currentTab === "table" && msg.query_result && (
                      <div className="max-h-56 overflow-auto border border-[#e5e7eb] rounded-lg">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-[#f9fafb] text-[#6b7280] uppercase tracking-wider sticky top-0 border-b border-[#e5e7eb]">
                            <tr>
                              {msg.query_result.columns.map((col) => (
                                <th key={col} className="p-2 border-r border-[#e5e7eb] font-semibold text-[#374151]">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f3f4f6]">
                            {msg.query_result.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-[#f9fafb]">
                                {msg.query_result!.columns.map((col) => {
                                  const val = row[col];
                                  const isNumber = !isNaN(Number(val)) && val !== null && val !== "";
                                  return (
                                    <td
                                      key={col}
                                      className={`p-2 border-r border-[#e5e7eb] ${
                                        isNumber ? "text-right tabular-nums font-mono text-[#111827] font-medium" : "text-left text-[#374151]"
                                      }`}
                                    >
                                      {val !== null && val !== undefined ? String(val) : "null"}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Live Active Steps when Executing */}
        {isExecuting && activeSteps.length > 0 && (
          <div className="w-full bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-2xs">
            <AgentTimeline steps={activeSteps} isExecuting={true} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <div className="p-4 border-t border-[#e5e7eb] bg-[#fafafa] shrink-0">
        {/* Quick suggestion chips above input when in conversation */}
        {hasLoadedSpreadsheet && messages.length > 0 && activePrompts.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 scrollbar-none">
            <span className="text-[#9ca3af] text-[10px] font-medium shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#0099ff]" /> Try:
            </span>
            {activePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isExecuting}
                onClick={() => onSendMessage(prompt)}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] bg-white hover:bg-[#f9fafb] text-[#374151] hover:text-[#101010] border border-[#e5e7eb] hover:border-[#d1d5db] rounded-md transition-all shrink-0 cursor-pointer shadow-2xs font-sans disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={!hasLoadedSpreadsheet || isExecuting}
            placeholder={
              hasLoadedSpreadsheet
                ? "Ask anything about the spreadsheet or request a transformation..."
                : "Upload or load a spreadsheet to begin querying..."
            }
            className="flex-1 bg-white border border-[#e5e7eb] rounded-lg px-3.5 py-2.5 text-xs text-[#18181b] placeholder-[#9ca3af] focus:outline-none focus:border-[#101010] focus:ring-1 focus:ring-[#101010]/20 disabled:opacity-50 disabled:bg-[#f3f4f6] transition-all font-sans"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isExecuting || !hasLoadedSpreadsheet}
            className="cal-button-primary p-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
