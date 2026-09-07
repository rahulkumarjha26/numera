"use client";

import React, { useState } from "react";
import { Check, AlertCircle, ChevronDown, ChevronUp, Cpu } from "lucide-react";

export interface AgentStep {
  agent: string;
  status: "completed" | "warning" | "error" | "running";
  title: string;
  detail: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

interface AgentTimelineProps {
  steps: AgentStep[];
  isExecuting: boolean;
}

export function AgentTimeline({ steps, isExecuting }: AgentTimelineProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (steps.length === 0 && !isExecuting) return null;

  return (
    <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-xl p-3.5 shadow-2xs mb-3.5">
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#101010]" />
          <h4 className="text-[11px] font-semibold text-[#101010] tracking-tight flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-[#101010]" />
            LangGraph Reasoning Trace
          </h4>
        </div>
        <span className="text-[10px] text-[#6b7280] font-mono">
          {steps.length} {steps.length === 1 ? "step" : "steps"} executed
        </span>
      </div>

      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isExpanded = expandedIndex === idx;
          const hasMetadata = step.metadata && Object.keys(step.metadata).length > 0;

          return (
            <div
              key={idx}
              className="bg-white border border-[#e5e7eb] rounded-lg p-2.5 text-xs shadow-2xs transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#101010] text-[11px]">{step.agent}</span>
                      <span className="text-[#9ca3af]">•</span>
                      <span className="text-[#4b5563] text-[11px]">{step.title}</span>
                    </div>
                    <p className="text-[11px] text-[#6b7280] mt-0.5 leading-relaxed">{step.detail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {step.duration_ms !== undefined && (
                    <span className="text-[10px] font-mono text-[#4b5563] px-1.5 py-0.5 rounded bg-[#f3f4f6] border border-[#e5e7eb]">
                      {step.duration_ms}ms
                    </span>
                  )}
                  {hasMetadata && (
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="p-1 text-[#9ca3af] hover:text-[#101010] transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Step Payload */}
              {isExpanded && hasMetadata && (
                <div className="mt-2 pt-2 border-t border-[#f3f4f6] font-mono text-[10px] bg-[#18181b] p-2.5 rounded-md text-gray-200 overflow-x-auto shadow-inner">
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(step.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}

        {isExecuting && (
          <div className="bg-white border border-[#d1d5db] rounded-lg p-2.5 text-xs flex items-center gap-2.5 shadow-2xs">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#101010] border-t-transparent animate-spin shrink-0" />
            <span className="font-medium text-[#101010] text-[11px]">LangGraph Agent Reasoning...</span>
          </div>
        )}
      </div>
    </div>
  );
}
