"""
Orchestrates ingestion of all 10 specialist collections.
Run from project root: python scripts/ingest_all.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.ingest_specialist import ingest_specialist

SPECIALISTS = [
    ("general_practitioner", "gp_general",       "rag_data/general_practitioner"),
    ("cardiologist",         "cardiology",        "rag_data/cardiologist"),
    ("orthopedist",          "orthopedics",       "rag_data/orthopedist"),
    ("gynecologist",         "gynecology",        "rag_data/gynecologist"),
    ("neurologist",          "neurology",         "rag_data/neurologist"),
    ("dermatologist",        "dermatology",       "rag_data/dermatologist"),
    ("gastroenterologist",   "gastroenterology",  "rag_data/gastroenterologist"),
    ("pulmonologist",        "pulmonology",       "rag_data/pulmonologist"),
    ("pediatrician",         "pediatrics",        "rag_data/pediatrician"),
    ("psychiatrist",         "psychiatry",        "rag_data/psychiatrist"),
    ("dentist",              "dentistry",         "rag_data/dentist"),
]

CHROMA_PATH = "./chroma_db"

if __name__ == "__main__":
    for specialty_key, collection_name, data_dir in SPECIALISTS:
        print(f"\n{'='*60}")
        print(f"Ingesting: {specialty_key}")
        print(f"{'='*60}")
        ingest_specialist(specialty_key, collection_name, data_dir, CHROMA_PATH)
    print("\nAll specialists ingested successfully.")
