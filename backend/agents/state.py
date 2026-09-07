from typing import TypedDict, List, Dict, Any, Optional

class AgentStep(TypedDict):
    agent: str
    status: str # "running" | "completed" | "warning" | "error"
    title: str
    detail: str
    duration_ms: Optional[float]
    metadata: Optional[Dict[str, Any]]

class AgentState(TypedDict):
    user_query: str
    data_dictionary: str
    sheet_names: List[str]
    intent: str # "aggregation" | "transformation" | "visualization" | "general_qa"
    plan: str
    generated_sql: Optional[str]
    transformation_sqls: Optional[List[str]]
    query_result: Optional[Dict[str, Any]]
    error: Optional[str]
    retry_count: int
    max_retries: int
    chart_spec: Optional[Dict[str, Any]]
    modified_file: Optional[Dict[str, Any]]
    final_answer: Optional[str]
    steps: List[AgentStep]
