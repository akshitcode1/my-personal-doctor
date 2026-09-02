from typing import Tuple
from backend.rag.chroma_client import get_chroma_client
from backend.rag.embedder import get_embedder
from backend.config.constants import RAG_TOP_K


def retrieve_context(query: str, collection_name: str) -> Tuple[str, list[str]]:
    """
    Returns (formatted_context_string, list_of_chunk_ids).
    Fetches top-K=3 semantically relevant chunks from the specialist's Chroma collection.
    Returns ("", []) gracefully if the collection doesn't exist yet (before ingestion).
    """
    client = get_chroma_client()
    embedder = get_embedder()

    try:
        collection = client.get_collection(collection_name)
    except Exception:
        return "", []

    query_embedding = embedder.encode(query).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=RAG_TOP_K,
        include=["documents", "metadatas", "ids"],
    )

    docs: list[str] = results["documents"][0] if results["documents"] else []
    ids: list[str] = results["ids"][0] if results["ids"] else []

    if not docs:
        return "", []

    formatted = "\n\n---\n\n".join(
        f"[Source {i + 1}]: {doc}" for i, doc in enumerate(docs)
    )
    return formatted, ids
