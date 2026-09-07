import os
import uuid
import shutil
from typing import Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from core.profiler import SheetProfiler
from core.duckdb_engine import DuckDBEngine
from agents.graph import build_omnisheet_graph
from agents.state import AgentState

app = FastAPI(
    title="OmniSheet AI API",
    description="Enterprise Air-Gapped Multi-Agent Excel Analytics & Transformation Engine",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/tmp/omnisheet_uploads"
EXPORT_DIR = "/tmp/omnisheet_exports"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(EXPORT_DIR, exist_ok=True)

# In-memory session store
# session_id -> { "file_path": str, "metadata": dict, "engine": DuckDBEngine }
SESSIONS: Dict[str, Dict[str, Any]] = {}

class QueryRequest(BaseModel):
    session_id: str
    query: str

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "DuckDB in-memory OLAP",
        "orchestrator": "LangGraph StateGraph",
        "active_sessions": len(SESSIONS)
    }

@app.get("/api/llm-status")
def llm_status():
    """Returns real-time status of local Ollama connection and active models."""
    from agents.llm_provider import LLMProvider
    provider = LLMProvider()
    return provider.get_status()

@app.post("/api/load-sample")
def load_sample_dataset():
    """Loads the pre-generated 50,000-row enterprise sales dataset."""
    sample_path = "/Users/rahuljha/Revision/numera/sample_data/enterprise_sales_50k.xlsx"
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Sample dataset not found")

    session_id = str(uuid.uuid4())
    metadata = SheetProfiler.profile_workbook(sample_path)
    engine = DuckDBEngine(sample_path)

    SESSIONS[session_id] = {
        "file_path": sample_path,
        "metadata": metadata,
        "engine": engine
    }

    return {
        "session_id": session_id,
        "metadata": metadata
    }

@app.post("/api/upload")
async def upload_spreadsheet(file: UploadFile = File(...)):
    """Uploads and profiles any .xlsx, .xls, .csv, or .tsv file."""
    if not file.filename.lower().endswith((".xlsx", ".xls", ".csv", ".tsv", ".txt")):
        raise HTTPException(status_code=400, detail="Only .xlsx, .xls, .csv, and .tsv files supported.")

    session_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, f"{session_id}_{file.filename}")

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        metadata = SheetProfiler.profile_workbook(save_path)
        engine = DuckDBEngine(save_path)

        SESSIONS[session_id] = {
            "file_path": save_path,
            "metadata": metadata,
            "engine": engine
        }

        return {
            "session_id": session_id,
            "metadata": metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest spreadsheet: {str(e)}")

@app.post("/api/query")
def run_agent_query(req: QueryRequest):
    """Executes the multi-agent LangGraph workflow for a user question."""
    session = SESSIONS.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Please upload or load a spreadsheet first.")

    engine = session["engine"]
    metadata = session["metadata"]

    # Compile the LangGraph engine
    graph = build_omnisheet_graph(engine, EXPORT_DIR)

    initial_state: AgentState = {
        "user_query": req.query,
        "data_dictionary": metadata["data_dictionary"],
        "sheet_names": metadata["sheet_names"],
        "intent": "aggregation",
        "plan": "",
        "generated_sql": None,
        "transformation_sqls": None,
        "query_result": None,
        "error": None,
        "retry_count": 0,
        "max_retries": 2,
        "chart_spec": None,
        "modified_file": None,
        "final_answer": None,
        "steps": []
    }

    try:
        final_state = graph.invoke(initial_state)

        # Prepare download URL if file modified
        download_url = None
        if final_state.get("modified_file") and final_state["modified_file"].get("modified_file_name"):
            download_url = f"/api/download/{final_state['modified_file']['modified_file_name']}"

        return {
            "success": True,
            "user_query": req.query,
            "intent": final_state["intent"],
            "plan": final_state["plan"],
            "steps": final_state["steps"],
            "generated_sql": final_state.get("generated_sql"),
            "transformation_sqls": final_state.get("transformation_sqls"),
            "query_result": final_state.get("query_result"),
            "chart_spec": final_state.get("chart_spec"),
            "download_url": download_url,
            "modified_file": final_state.get("modified_file"),
            "final_answer": final_state.get("final_answer")
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Agent workflow error: {str(e)}")

@app.get("/api/download/{filename}")
def download_file(filename: str):
    """Serves modified Excel workbooks and CSV files."""
    file_path = os.path.join(EXPORT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested file not found or expired.")

    media_type = "text/csv" if filename.endswith(".csv") else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
