import asyncio
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from backend.api.dependencies import get_current_user
from backend.config.constants import PDF_MAX_SIZE_BYTES
from backend.graph.nodes import summarize_document
from backend.pdf.processor import processor
from backend.services import chat_service, document_service
from backend.services.supabase_client import get_supabase

router = APIRouter()


async def _process_pdf(doc_id: str, pdf_bytes: bytes) -> str | None:
    """Extract text via OCR, generate AI summary, persist both. Returns summary."""
    try:
        text = processor.extract_text(pdf_bytes)
        context = processor.chunk_for_context(text)
        summary = await summarize_document(context or text[:3500])
        await document_service.update_document_text_and_summary(doc_id, context, summary)
        return summary
    except Exception as e:
        await document_service.mark_document_failed(doc_id, str(e))
        return None


@router.post("/chats/{chat_id}/documents", status_code=status.HTTP_201_CREATED)
async def upload_document(
    chat_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    chat = await chat_service.get_chat(chat_id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > PDF_MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 20MB limit")

    # Store raw PDF in Supabase Storage
    sb = get_supabase()
    storage_path = f"{user_id}/{chat_id}/{file.filename}"
    sb.storage.from_("medical-documents").upload(
        path=storage_path,
        file=pdf_bytes,
        file_options={"content-type": "application/pdf"},
    )

    doc = await document_service.create_document_record(
        chat_id=chat_id,
        user_id=user_id,
        filename=file.filename,
        file_size=len(pdf_bytes),
        storage_path=storage_path,
    )

    # Process synchronously so the summary is available in the response
    summary = await _process_pdf(doc["id"], pdf_bytes)
    doc["summary"] = summary
    return doc


@router.get("/chats/{chat_id}/documents")
async def list_documents(chat_id: str, user_id: str = Depends(get_current_user)):
    chat = await chat_service.get_chat(chat_id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return await document_service.get_documents(chat_id)


@router.delete("/chats/{chat_id}/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(chat_id: str, doc_id: str, user_id: str = Depends(get_current_user)):
    chat = await chat_service.get_chat(chat_id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    await document_service.delete_document(doc_id, user_id)
