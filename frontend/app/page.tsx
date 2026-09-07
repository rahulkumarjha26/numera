"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { SpreadsheetGrid, SpreadsheetMetadata } from "@/components/SpreadsheetGrid";
import { InteractiveChat, ChatMessage } from "@/components/InteractiveChat";
import { AgentStep } from "@/components/AgentTimeline";
import { ToastNotification, ToastMessage } from "@/components/ToastNotification";
import { LandingPage } from "@/components/LandingPage";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function Home() {
  const [viewMode, setViewMode] = useState<"landing" | "workspace">("landing");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<SpreadsheetMetadata | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [activeSteps, setActiveSteps] = useState<AgentStep[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadSample = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/load-sample`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to load enterprise sample dataset");

      const data = await res.json();
      setSessionId(data.session_id);
      setMetadata(data.metadata);
      if (data.metadata.sheet_names.length > 0) {
        setActiveSheet(data.metadata.sheet_names[0]);
      }
      setMessages([]);
      setViewMode("workspace");
      setToast({
        id: `toast_${Date.now()}`,
        type: "success",
        title: "Enterprise Benchmark Loaded",
        description: "50,032 records loaded into local DuckDB memory (245 schema tokens)."
      });
    } catch (err: any) {
      console.error(err);
      setToast({
        id: `toast_${Date.now()}`,
        type: "error",
        title: "Load Failed",
        description: "Could not connect to local DuckDB inference server on port 8000."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadRawFile = async (file: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv", ".tsv", ".txt"];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setToast({
        id: `toast_${Date.now()}`,
        type: "error",
        title: "Unsupported File Format",
        description: "Please upload an Excel spreadsheet (.xlsx, .xls) or delimited file (.csv, .tsv)."
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Upload failed");
      }

      const data = await res.json();
      setSessionId(data.session_id);
      setMetadata(data.metadata);
      if (data.metadata.sheet_names.length > 0) {
        setActiveSheet(data.metadata.sheet_names[0]);
      }
      setMessages([]);
      setViewMode("workspace");
      setToast({
        id: `toast_${Date.now()}`,
        type: "success",
        title: "Spreadsheet Ingested",
        description: `${data.metadata.total_rows.toLocaleString()} records indexed into local in-memory DuckDB OLAP.`
      });
    } catch (err: any) {
      console.error(err);
      setToast({
        id: `toast_${Date.now()}`,
        type: "error",
        title: "Ingestion Error",
        description: err.message || "Failed to process the uploaded spreadsheet."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadRawFile(file);
    }
    e.target.value = "";
  };

  const handleSendMessage = async (query: string) => {
    if (!sessionId) return;

    const userMsgId = `user_${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMsgId, sender: "user", text: query }
    ];
    setMessages(newMessages);

    setIsExecuting(true);
    setActiveSteps([
      {
        agent: "Supervisor Agent",
        status: "running",
        title: "Planning & Intent Classification",
        detail: "Synthesizing query against statistical data dictionary..."
      }
    ]);

    try {
      const res = await fetch(`${API_BASE}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, query })
      });

      if (!res.ok) throw new Error("Agent execution failed");
      const data = await res.json();

      const agentMsgId = `agent_${Date.now()}`;
      setMessages([
        ...newMessages,
        {
          id: agentMsgId,
          sender: "agent",
          text: data.final_answer || "Query executed.",
          steps: data.steps || [],
          generated_sql: data.generated_sql,
          transformation_sqls: data.transformation_sqls,
          query_result: data.query_result,
          chart_spec: data.chart_spec,
          download_url: data.download_url,
          modified_file: data.modified_file
        }
      ]);
    } catch (err: any) {
      const agentMsgId = `agent_${Date.now()}`;
      setMessages([
        ...newMessages,
        {
          id: agentMsgId,
          sender: "agent",
          text: `⚠️ Execution error: ${err.message || "Failed to process query."}`
        }
      ]);
    } finally {
      setIsExecuting(false);
      setActiveSteps([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb] text-[#18181b] font-sans antialiased selection:bg-[#101010] selection:text-white">
      {/* Cal.com Floating Notification Toast */}
      <ToastNotification toast={toast} onDismiss={() => setToast(null)} />

      {viewMode === "landing" ? (
        <LandingPage
          onLoadSample={loadSample}
          onFileUpload={uploadRawFile}
          isLoading={isLoading}
          onOpenWorkspace={() => setViewMode("workspace")}
          hasActiveSession={!!sessionId}
        />
      ) : (
        <div className="h-screen flex flex-col overflow-hidden">
          {/* Top Cal.com Minimalist Header */}
          <Header
            onLoadSample={loadSample}
            onFileUpload={handleFileInputChange}
            onNavigateHome={() => setViewMode("landing")}
            isLoading={isLoading}
            activeFileName={metadata?.file_name}
            totalRows={metadata?.total_rows}
          />

          {/* Main Dual-Pane Workspace */}
          <main className="flex-1 max-w-[1760px] w-full mx-auto p-4 grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-62px)] overflow-hidden">
            {/* Left Column: Data Grid */}
            <div className="xl:col-span-7 h-full overflow-hidden flex flex-col">
              <SpreadsheetGrid
                metadata={metadata}
                activeSheet={activeSheet}
                onSelectSheet={setActiveSheet}
              />
            </div>

            {/* Right Column: Agent Console */}
            <div className="xl:col-span-5 h-full overflow-hidden flex flex-col">
              <InteractiveChat
                messages={messages}
                onSendMessage={handleSendMessage}
                isExecuting={isExecuting}
                activeSteps={activeSteps}
                hasLoadedSpreadsheet={!!sessionId}
                suggestedQueries={metadata?.suggested_queries}
              />
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
