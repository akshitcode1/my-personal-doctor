"""
Verifies all 10 Chroma collections were ingested successfully.
Run from project root: python scripts/verify_collections.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import chromadb
from sentence_transformers import SentenceTransformer

CHROMA_PATH = "./chroma_db"

COLLECTIONS = {
    "general_practitioner": "gp_general",
    "cardiologist":         "cardiology",
    "orthopedist":          "orthopedics",
    "gynecologist":         "gynecology",
    "neurologist":          "neurology",
    "dermatologist":        "dermatology",
    "gastroenterologist":   "gastroenterology",
    "pulmonologist":        "pulmonology",
    "pediatrician":         "pediatrics",
    "psychiatrist":         "psychiatry",
}

SAMPLE_QUERIES = {
    "gp_general":       "common cold symptoms",
    "cardiology":       "heart attack symptoms",
    "orthopedics":      "knee pain after running",
    "gynecology":       "menstrual cramps",
    "neurology":        "migraine headache",
    "dermatology":      "skin rash treatment",
    "gastroenterology": "stomach pain after eating",
    "pulmonology":      "shortness of breath",
    "pediatrics":       "fever in children",
    "psychiatry":       "anxiety symptoms",
}

if __name__ == "__main__":
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    embedder = SentenceTransformer("all-MiniLM-L6-v2")

    all_ok = True
    for specialty, collection_name in COLLECTIONS.items():
        try:
            col = client.get_collection(collection_name)
            count = col.count()
            query = SAMPLE_QUERIES[collection_name]
            emb = embedder.encode(query).tolist()
            results = col.query(query_embeddings=[emb], n_results=1)
            top_doc = results["documents"][0][0][:100] if results["documents"] else "N/A"
            print(f"[OK] {specialty:25s} | {count:5d} chunks | Sample: {top_doc}...")
        except Exception as e:
            print(f"[FAIL] {specialty:25s} | Error: {e}")
            all_ok = False

    print("\nVerification complete." if all_ok else "\nSome collections failed — run ingest_all.py first.")
