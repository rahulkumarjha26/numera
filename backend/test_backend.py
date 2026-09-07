import sys
import os
sys.path.insert(0, "/Users/rahuljha/Revision/numera/backend")

from core.profiler import SheetProfiler
from core.duckdb_engine import DuckDBEngine
from agents.graph import build_omnisheet_graph
from agents.state import AgentState

def run_test():
    sample_path = "/Users/rahuljha/Revision/numera/sample_data/enterprise_sales_50k.xlsx"
    print("[1/4] Profiling sample dataset...")
    meta = SheetProfiler.profile_workbook(sample_path)
    print(f"  -> Total rows: {meta['total_rows']:,}")
    print(f"  -> Sheets: {meta['sheet_names']}")
    print(f"  -> Token estimate: {meta['estimated_token_count']} tokens")

    print("\n[2/4] Initializing DuckDB Engine...")
    engine = DuckDBEngine(sample_path)

    print("\n[3/4] Building & Invoking LangGraph Multi-Agent Workflow for Aggregation...")
    graph = build_omnisheet_graph(engine, "/tmp/omnisheet_exports")
    
    query = "What is the total revenue and net profit by sales channel?"
    state: AgentState = {
        "user_query": query,
        "data_dictionary": meta["data_dictionary"],
        "sheet_names": meta["sheet_names"],
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

    result = graph.invoke(state)
    print(f"  -> Plan: {result['plan']}")
    print(f"  -> Generated SQL: {result['generated_sql']}")
    print(f"  -> DuckDB Duration: {result['query_result']['duration_ms']} ms")
    print(f"  -> Rows returned: {len(result['query_result']['rows'])}")
    print(f"  -> Chart Type: {result.get('chart_spec', {}).get('chart_type') if result.get('chart_spec') else 'None'}")
    print(f"  -> Total Agent Steps executed: {len(result['steps'])}")
    for s in result["steps"]:
        print(f"     * [{s['agent']}]: {s['title']} ({s['duration_ms']}ms)")

    print("\n[4/4] Testing Transformation & Excel Export...")
    trans_query = "Add a new column margin_percentage and export a modified spreadsheet."
    state_trans: AgentState = {
        "user_query": trans_query,
        "data_dictionary": meta["data_dictionary"],
        "sheet_names": meta["sheet_names"],
        "intent": "transformation",
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

    res_trans = graph.invoke(state_trans)
    mod_file = res_trans.get("modified_file", {})
    print(f"  -> Exported file: {mod_file.get('modified_file_name')}")
    print(f"  -> Export file size: {mod_file.get('file_size_mb')} MB")
    print(f"  -> Transformation duration: {mod_file.get('duration_ms')} ms")

    engine.close()
    print("\n[SUCCESS] All multi-agent backend pipeline tests passed!")

if __name__ == "__main__":
    run_test()
