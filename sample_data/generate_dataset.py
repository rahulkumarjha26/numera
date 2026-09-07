import os
import random
from datetime import datetime, timedelta
import polars as pl
import xlsxwriter

def generate_enterprise_dataset(output_path: str, num_transactions: int = 50000):
    print(f"Generating realistic enterprise dataset with {num_transactions:,} rows...")
    random.seed(42)

    categories = {
        "Cloud & AI Infrastructure": ["Enterprise GPU Cluster", "Vector DB Node", "Inference Gateway", "Model Registry License"],
        "Cybersecurity": ["Zero Trust Gateway", "SIEM Sensor", "Threat Intelligence Feed", "EDR Enterprise Agent"],
        "SaaS & Productivity": ["Collaborative Work OS", "OmniSheet Enterprise", "Automated Ops Suite", "Data Pipeline Pro"],
        "Hardware & Networking": ["Edge Server Gen4", "100GbE Switch", "Hardware Security Module", "Rackmount SAN Array"]
    }

    products = []
    prod_id = 101
    for cat, items in categories.items():
        for name in items:
            products.append({
                "product_id": f"PRD-{prod_id}",
                "category": cat,
                "product_name": name,
                "target_margin": round(random.uniform(0.35, 0.75), 2),
                "list_price": round(random.uniform(500, 15000), 2)
            })
            prod_id += 1

    df_products = pl.DataFrame(products)

    regions = ["North America", "EMEA", "APAC", "LATAM"]
    channels = ["Direct Sales", "Enterprise Partner", "Online Portal", "Gov RFP"]

    start_date = datetime(2025, 1, 1)
    
    transactions = []
    for i in range(1, num_transactions + 1):
        prod = random.choice(products)
        reg = random.choice(regions)
        chan = random.choice(channels)
        date_offset = random.randint(0, 364)
        order_date = (start_date + timedelta(days=date_offset)).strftime("%Y-%m-%d")
        
        units = random.randint(1, 25) if "Enterprise" in prod["product_name"] else random.randint(5, 120)
        discount = random.choice([0.0, 0.05, 0.10, 0.15, 0.20, 0.25])
        unit_price = prod["list_price"] * (1.0 - discount)
        revenue = round(units * unit_price, 2)
        cogs = round(revenue * (1.0 - prod["target_margin"] + random.uniform(-0.05, 0.05)), 2)
        net_profit = round(revenue - cogs, 2)

        transactions.append({
            "order_id": f"ORD-{100000 + i}",
            "order_date": order_date,
            "customer_id": f"CUST-{random.randint(100, 999)}",
            "product_id": prod["product_id"],
            "region": reg,
            "sales_channel": chan,
            "units_sold": units,
            "unit_price": round(unit_price, 2),
            "discount_pct": discount,
            "revenue": revenue,
            "cogs": cogs,
            "net_profit": net_profit
        })

    df_trans = pl.DataFrame(transactions)

    regional_targets = []
    for r in regions:
        for q in ["Q1-2025", "Q2-2025", "Q3-2025", "Q4-2025"]:
            regional_targets.append({
                "region": r,
                "quarter": q,
                "target_revenue": random.randint(15000000, 35000000),
                "quota_reps": random.randint(12, 45)
            })

    df_targets = pl.DataFrame(regional_targets)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with xlsxwriter.Workbook(output_path) as workbook:
        # Write Transactions
        df_trans.write_excel(workbook=workbook, worksheet="Transactions")
        # Write Products
        df_products.write_excel(workbook=workbook, worksheet="Products")
        # Write Targets
        df_targets.write_excel(workbook=workbook, worksheet="Regional_Targets")

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Successfully generated: {output_path} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    out_file = "/Users/rahuljha/Revision/numera/sample_data/enterprise_sales_50k.xlsx"
    generate_enterprise_dataset(out_file, 50000)
