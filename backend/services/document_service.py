from typing import Optional
from backend.services.supabase_client import get_supabase
from backend.config.constants import MAX_DOCUMENT_CONTEXT_CHARS


async def create_document_record(
    chat_id: str,
    user_id: str,
    filename: str,
    file_size: int,
    storage_path: str,
) -> dict:
    sb = get_supabase()
    result = sb.table("uploaded_documents").insert({
        "chat_id": chat_id,
        "user_id": user_id,
        "filename": filename,
        "file_size": file_size,
        "storage_path": storage_path,
        "processing_status": "processing",
    }).execute()
    return result.data[0]


async def update_document_extracted_text(doc_id: str, extracted_text: str) -> None:
    sb = get_supabase()
    sb.table("uploaded_documents").update({
        "extracted_text": extracted_text,
        "processing_status": "completed",
    }).eq("id", doc_id).execute()


async def update_document_text_and_summary(doc_id: str, extracted_text: str, summary: str) -> None:
    sb = get_supabase()
    try:
        sb.table("uploaded_documents").update({
            "extracted_text": extracted_text,
            "summary": summary,
            "processing_status": "completed",
        }).eq("id", doc_id).execute()
    except Exception:
        # summary column may not exist yet — fall back without it
        sb.table("uploaded_documents").update({
            "extracted_text": extracted_text,
            "processing_status": "completed",
        }).eq("id", doc_id).execute()


async def mark_document_failed(doc_id: str, error: str) -> None:
    sb = get_supabase()
    sb.table("uploaded_documents").update({
        "processing_status": "failed",
        "error_message": error,
    }).eq("id", doc_id).execute()


async def get_documents(chat_id: str) -> list[dict]:
    sb = get_supabase()
    result = (
        sb.table("uploaded_documents")
        .select("id,filename,file_size,processing_status,created_at")
        .eq("chat_id", chat_id)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data


async def delete_document(doc_id: str, user_id: str) -> None:
    sb = get_supabase()
    sb.table("uploaded_documents").delete().eq("id", doc_id).eq("user_id", user_id).execute()


async def get_document_context(chat_id: str) -> Optional[str]:
    """
    Returns concatenated OCR text from all completed documents in this chat,
    truncated to MAX_DOCUMENT_CONTEXT_CHARS.
    """
    sb = get_supabase()
    result = (
        sb.table("uploaded_documents")
        .select("filename,extracted_text")
        .eq("chat_id", chat_id)
        .eq("processing_status", "completed")
        .execute()
    )
    if not result.data:
        return None

    parts = []
    for doc in result.data:
        if doc.get("extracted_text"):
            parts.append(f"[File: {doc['filename']}]\n{doc['extracted_text']}")

    if not parts:
        return None

    combined = "\n\n---\n\n".join(parts)
    if len(combined) > MAX_DOCUMENT_CONTEXT_CHARS:
        combined = combined[:MAX_DOCUMENT_CONTEXT_CHARS] + "\n\n[Document truncated]"
    return combined
