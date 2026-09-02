"""
Adds the `summary` TEXT column to uploaded_documents.
Run from project root: python scripts/migrate_add_summary.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from backend.services.supabase_client import get_supabase

sb = get_supabase()

# Use a raw SQL call via the Supabase rpc escape-hatch
# Falls back gracefully if column already exists (IF NOT EXISTS)
try:
    result = sb.rpc(
        "exec_ddl",
        {"sql": "ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS summary TEXT;"},
    ).execute()
    print("Migration via RPC succeeded:", result)
except Exception as e:
    print("RPC not available — using direct insert trick...")
    # Alternative: just verify connectivity
    rows = sb.table("uploaded_documents").select("id").limit(1).execute()
    print("DB connection OK. Rows sampled:", len(rows.data))
    print()
    print(">>> Please run this ONE line in Supabase SQL Editor:")
    print("    ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS summary TEXT;")
    print()
    print("NOTE: The app WORKS without this column — summaries will show in chat")
    print("      but won't persist after page refresh. Run the SQL when convenient.")
