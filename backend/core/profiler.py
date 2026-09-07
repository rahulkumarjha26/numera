import os
import re
import json
from typing import Dict, Any, List
import fastexcel
import polars as pl
import duckdb

class SheetProfiler:
    """
    Ultra-fast schema extraction and statistical profiling.
    Supports Excel (.xlsx, .xls, .xlsb) and delimited files (.csv, .tsv, .txt).
    Produces a compact (<350 tokens) Data Dictionary for LLM context,
    and a preview table for the UI.
    """

    @staticmethod
    def profile_workbook(file_path: str) -> Dict[str, Any]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Spreadsheet not found at: {file_path}")

        file_size_bytes = os.path.getsize(file_path)
        file_name = os.path.basename(file_path)
        is_csv = file_path.lower().endswith((".csv", ".tsv", ".txt"))

        # Strip UUID prefix if present from uploads (e.g., 'uuid_actual_name.csv')
        clean_file_name = file_name
        if len(file_name) > 37 and file_name[36] == '_' and '-' in file_name[:36]:
            clean_file_name = file_name[37:]

        sheets_meta = {}
        total_rows = 0
        sheet_names = []
        sheets_data = []

        if is_csv:
            raw_stem = os.path.splitext(clean_file_name)[0]
            clean_sheet_name = raw_stem or "Data"
            sheet_names = [clean_sheet_name]

            separator = "\t" if file_path.lower().endswith(".tsv") else ","
            try:
                polars_df = pl.read_csv(
                    file_path,
                    separator=separator,
                    infer_schema_length=10000,
                    ignore_errors=True,
                    truncate_ragged_lines=True,
                    encoding="utf8"
                )
            except Exception:
                polars_df = pl.read_csv(
                    file_path,
                    separator=separator,
                    infer_schema_length=10000,
                    ignore_errors=True,
                    truncate_ragged_lines=True,
                    encoding="utf8-lossy"
                )
            sheets_data.append((clean_sheet_name, polars_df))
        else:
            excel_reader = fastexcel.read_excel(file_path)
            sheet_names = excel_reader.sheet_names
            for s_name in sheet_names:
                polars_df = pl.from_arrow(excel_reader.load_sheet(s_name).to_arrow())
                sheets_data.append((s_name, polars_df))

        for s_name, polars_df in sheets_data:
            num_rows, num_cols = polars_df.shape
            total_rows += num_rows

            # Fast sampling for high-row datasets (e.g., 579k rows) to keep profiling instant
            sample_for_stats = polars_df.sample(min(10000, num_rows), seed=42) if num_rows > 20000 else polars_df

            columns_meta = []
            for col_name in polars_df.columns:
                series = polars_df[col_name]
                dtype_str = str(series.dtype)
                null_count = series.null_count()
                null_pct = round((null_count / num_rows) * 100, 1) if num_rows > 0 else 0

                stats_series = sample_for_stats[col_name]
                sample_repr = ""
                if series.dtype in [pl.Int64, pl.Int32, pl.Int16, pl.Int8, pl.Float64, pl.Float32, pl.UInt64, pl.UInt32]:
                    s_non_null = stats_series.drop_nulls()
                    if len(s_non_null) > 0:
                        min_val = round(float(s_non_null.min()), 2)
                        max_val = round(float(s_non_null.max()), 2)
                        sample_repr = f"min={min_val}, max={max_val}"
                    else:
                        sample_repr = "all nulls"
                elif series.dtype in [pl.Date, pl.Datetime]:
                    s_non_null = stats_series.drop_nulls()
                    if len(s_non_null) > 0:
                        sample_repr = f"from {s_non_null.min()} to {s_non_null.max()}"
                else:
                    uniques = [str(x) for x in stats_series.drop_nulls().unique().to_list()[:4]]
                    sample_repr = f"e.g. {uniques}"

                columns_meta.append({
                    "name": col_name,
                    "type": dtype_str,
                    "null_pct": null_pct,
                    "sample": sample_repr
                })

            # Fast preview (first 15 rows)
            preview_df = polars_df.head(15)
            preview_rows = preview_df.to_dicts()
            clean_preview = []
            for row in preview_rows:
                clean_preview.append({k: str(v) if v is not None else None for k, v in row.items()})

            sheets_meta[s_name] = {
                "row_count": num_rows,
                "col_count": num_cols,
                "columns": columns_meta,
                "preview": clean_preview
            }

        # Build compact text Data Dictionary for LLM context
        data_dictionary_lines = [
            f"FILE: {clean_file_name} ({file_size_bytes / (1024*1024):.2f} MB, {total_rows:,} total rows across {len(sheets_meta)} sheet{'s' if len(sheets_meta) != 1 else ''})",
            "TABLES & COLUMNS:"
        ]

        for s_name, s_info in sheets_meta.items():
            data_dictionary_lines.append(f"\nTable `{s_name}` ({s_info['row_count']:,} rows, {s_info['col_count']} cols):")
            for c in s_info["columns"]:
                null_alert = f" [{c['null_pct']}% null]" if c['null_pct'] > 5 else ""
                data_dictionary_lines.append(f"  - `{c['name']}` ({c['type']}){null_alert}: {c['sample']}")

        data_dictionary_text = "\n".join(data_dictionary_lines)

        # Generate intelligent dynamic suggested queries based on schema
        suggested_queries = SheetProfiler.generate_suggested_queries(sheets_meta, clean_file_name)

        return {
            "file_name": clean_file_name,
            "file_size_bytes": file_size_bytes,
            "total_rows": total_rows,
            "sheet_names": sheet_names,
            "sheets": sheets_meta,
            "data_dictionary": data_dictionary_text,
            "estimated_token_count": int(len(data_dictionary_text.split()) * 1.3),
            "suggested_queries": suggested_queries
        }

    @staticmethod
    def generate_suggested_queries(sheets_meta: Dict[str, Any], file_name: str) -> List[str]:
        """
        Dynamically synthesizes 4 intelligent, domain-aware suggested analytical queries
        tailored to the specific sheets, columns, and data types found in the workbook.
        """
        if not sheets_meta:
            return [
                "What are the total rows and summary metrics?",
                "Which category or group has the highest volume?",
                "What is the distribution of key records?",
                "Add a new status column and export a modified spreadsheet"
            ]

        # Prioritize primary sheet (sheet with most rows or first)
        primary_sheet_name = max(sheets_meta.keys(), key=lambda k: sheets_meta[k]["row_count"])
        primary_sheet = sheets_meta[primary_sheet_name]
        cols = primary_sheet["columns"]

        numeric_keywords = [
            "revenue", "profit", "sales", "amount", "cost", "margin", "price",
            "budget", "salary", "score", "units", "quantity", "total", "balance",
            "spend", "target", "value", "net", "gross", "rate", "fee"
        ]
        cat_keywords = [
            "channel", "category", "state", "district", "city", "country",
            "region", "department", "status", "type", "segment", "brand",
            "sector", "gender", "role", "tier", "division", "level", "team",
            "group", "class", "industry", "source", "zone", "branch"
        ]
        date_keywords = ["date", "year", "month", "quarter", "day", "time", "timestamp", "period", "created", "updated"]
        entity_keywords = ["name", "title", "customer", "employee", "client", "ngo", "organization", "company", "vendor", "account", "partner", "item", "product", "lead", "agent"]

        numeric_cols = []
        cat_cols = []
        date_cols = []
        entity_cols = []

        for c in cols:
            col_name = c["name"]
            col_name_lower = col_name.lower()
            dtype = c["type"].lower()

            is_numeric = any(t in dtype for t in ["int", "float", "decimal", "uint", "double"])
            is_date = any(t in dtype for t in ["date", "time"]) or any(k in col_name_lower for k in date_keywords)

            if is_date:
                date_cols.append(col_name)
            elif is_numeric:
                numeric_cols.append(col_name)
            else:
                if any(k in col_name_lower for k in entity_keywords) and not any(k in col_name_lower for k in cat_keywords):
                    entity_cols.append(col_name)
                else:
                    cat_cols.append(col_name)

        def numeric_priority(col):
            cl = col.lower()
            for idx, kw in enumerate(numeric_keywords):
                if kw in cl:
                    return idx
            return 100
        numeric_cols.sort(key=numeric_priority)

        def cat_priority(col):
            cl = col.lower()
            for idx, kw in enumerate(cat_keywords):
                if kw in cl:
                    return idx
            return 100
        cat_cols.sort(key=cat_priority)

        sheet_names = list(sheets_meta.keys())
        has_multiple_sheets = len(sheet_names) > 1

        queries = []

        def nat_name(c: str) -> str:
            return c.replace("_", " ") if "_" in c else c

        # 1. Primary Aggregation Query
        if numeric_cols and cat_cols:
            m1 = nat_name(numeric_cols[0])
            c1 = nat_name(cat_cols[0])
            if len(numeric_cols) > 1:
                m2 = nat_name(numeric_cols[1])
                queries.append(f"What is the total {m1} and {m2} by {c1}?")
            else:
                queries.append(f"What is the total {m1} broken down by {c1}?")
        elif cat_cols:
            c1 = nat_name(cat_cols[0])
            queries.append(f"What are the top 5 most frequent {c1} in the dataset?")
        elif numeric_cols:
            m1 = nat_name(numeric_cols[0])
            queries.append(f"What is the average, minimum, and maximum {m1}?")
        else:
            queries.append(f"What is the total number of records in {primary_sheet_name}?")

        # 2. Extremum / Ranking Query
        if has_multiple_sheets and len(sheet_names) > 1:
            sec_sheet = sheet_names[1]
            sec_cols = [c["name"] for c in sheets_meta[sec_sheet]["columns"]]
            sec_num = [c for c in sec_cols if any(k in c.lower() for k in numeric_keywords)]
            sec_cat = [c for c in sec_cols if any(k in c.lower() for k in cat_keywords)]
            if sec_num and sec_cat:
                queries.append(f"Which {nat_name(sec_cat[0])} has the highest {nat_name(sec_num[0])}?")
            elif cat_cols and numeric_cols:
                c_dim = nat_name(cat_cols[1]) if len(cat_cols) > 1 else nat_name(cat_cols[0])
                m_dim = nat_name(numeric_cols[1]) if len(numeric_cols) > 1 else nat_name(numeric_cols[0])
                queries.append(f"Which {c_dim} has the highest {m_dim}?")
            else:
                queries.append(f"What are the key differences between {sheet_names[0]} and {sheet_names[1]}?")
        elif cat_cols and numeric_cols:
            c_dim = nat_name(cat_cols[1]) if len(cat_cols) > 1 else nat_name(cat_cols[0])
            m_dim = nat_name(numeric_cols[1]) if len(numeric_cols) > 1 else nat_name(numeric_cols[0])
            queries.append(f"Which {c_dim} has the highest {m_dim}?")
        elif entity_cols and numeric_cols:
            queries.append(f"Which {nat_name(entity_cols[0])} has the highest {nat_name(numeric_cols[0])}?")
        elif cat_cols:
            queries.append(f"Which {nat_name(cat_cols[0])} has the highest number of registered records?")
        elif numeric_cols:
            queries.append(f"What are the top 10 records by {nat_name(numeric_cols[0])}?")
        else:
            queries.append(f"What are the top 10 records in {primary_sheet_name}?")

        # 3. Distribution, Geography, or Temporal Trend
        loc_col = next((c for c in cat_cols if any(k in c.lower() for k in ["state", "district", "region", "city", "country", "zone"])), None)
        if loc_col and numeric_cols:
            queries.append(f"What is the sales performance across different {nat_name(loc_col)}s?")
        elif loc_col:
            queries.append(f"What is the distribution of records across {nat_name(loc_col)}?")
        elif date_cols and numeric_cols:
            queries.append(f"What is the trend of {nat_name(numeric_cols[0])} over time by {nat_name(date_cols[0])}?")
        elif len(cat_cols) >= 2:
            queries.append(f"Show the breakdown of {nat_name(cat_cols[0])} across different {nat_name(cat_cols[1])}s")
        elif cat_cols:
            queries.append(f"What are the distinct categories in {nat_name(cat_cols[0])} and their counts?")
        else:
            queries.append("What are the key statistical distributions across all columns?")

        # 4. Mutating Operation & Multi-Sheet Excel Export
        if numeric_cols:
            tier_col = numeric_cols[0]
            queries.append(f"Add a new column {tier_col}_tier and export a modified spreadsheet")
        elif cat_cols:
            queries.append(f"Filter records where {cat_cols[0]} is not null and export a modified spreadsheet")
        else:
            queries.append("Add a new column record_index and export a modified spreadsheet")

        return queries[:4]

if __name__ == "__main__":
    test_path = "/Users/rahuljha/Revision/numera/sample_data/enterprise_sales_50k.xlsx"
    res = SheetProfiler.profile_workbook(test_path)
    print("--- DATA DICTIONARY GENERATED ---")
    print(res["data_dictionary"])
    print(f"\nEstimated tokens: {res['estimated_token_count']} tokens (for {res['total_rows']:,} rows!)")
