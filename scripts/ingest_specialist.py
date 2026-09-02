"""
Core ingestion worker: chunks .txt files for one specialty and upserts into ChromaDB.
Usage:
    python scripts/ingest_specialist.py --specialty cardiologist --collection cardiology --data-dir rag_data/cardiologist
"""
import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import chromadb
from sentence_transformers import SentenceTransformer

CHUNK_SIZE_CHARS = 2000
CHUNK_OVERLAP_CHARS = 200
BATCH_SIZE = 500
EMBEDDING_BATCH = 64


def chunk_text(text: str) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks: list[str] = []
    current = ""
    for sent in sentences:
        if len(current) + len(sent) <= CHUNK_SIZE_CHARS:
            current += (" " if current else "") + sent
        else:
            if current.strip():
                chunks.append(current.strip())
            current = current[-CHUNK_OVERLAP_CHARS:] + " " + sent
    if current.strip():
        chunks.append(current.strip())
    return chunks


def ingest_specialist(specialty_key: str, collection_name: str, data_dir: str, chroma_path: str = "./chroma_db") -> None:
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path=chroma_path)
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"specialty": specialty_key},
    )

    all_chunks: list[str] = []
    all_ids: list[str] = []
    all_metadatas: list[dict] = []

    txt_files = list(Path(data_dir).rglob("*.txt"))
    if not txt_files:
        print(f"[{specialty_key}] No .txt files found in {data_dir}")
        return

    for file_path in txt_files:
        text = file_path.read_text(encoding="utf-8", errors="ignore")
        chunks = chunk_text(text)
        for i, chunk in enumerate(chunks):
            chunk_id = f"{specialty_key}_{file_path.stem}_{i}"
            all_chunks.append(chunk)
            all_ids.append(chunk_id)
            all_metadatas.append({
                "source": file_path.name,
                "specialty": specialty_key,
                "chunk_index": i,
            })

    print(f"[{specialty_key}] Embedding {len(all_chunks)} chunks...")
    embeddings = embedder.encode(all_chunks, batch_size=EMBEDDING_BATCH, show_progress_bar=True).tolist()

    for i in range(0, len(all_chunks), BATCH_SIZE):
        collection.upsert(
            documents=all_chunks[i:i + BATCH_SIZE],
            embeddings=embeddings[i:i + BATCH_SIZE],
            ids=all_ids[i:i + BATCH_SIZE],
            metadatas=all_metadatas[i:i + BATCH_SIZE],
        )

    print(f"[{specialty_key}] Done. {len(all_chunks)} chunks → collection '{collection_name}'")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--specialty", required=True)
    parser.add_argument("--collection", required=True)
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--chroma-path", default="./chroma_db")
    args = parser.parse_args()

    ingest_specialist(args.specialty, args.collection, args.data_dir, args.chroma_path)
