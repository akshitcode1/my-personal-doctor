import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from backend.api.dependencies import get_current_user
from backend.pdf.lab_parser import parse_lab_report

router = APIRouter()


def _extract_text_from_file(file_bytes: bytes, content_type: str) -> str:
    if "pdf" in content_type:
        from backend.pdf.processor import processor
        return processor.extract_text(file_bytes)

    # Image file — run OCR directly
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(io.BytesIO(file_bytes))
        return pytesseract.image_to_string(img).strip()
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Image OCR failed: {e}")


@router.post("/chats/{chat_id}/lab-report")
async def analyze_lab_report(
    chat_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    content_type = file.content_type or ""
    if not ("pdf" in content_type or "image" in content_type):
        raise HTTPException(status_code=400, detail="File must be a PDF or image")

    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB)")

    extracted_text = _extract_text_from_file(file_bytes, content_type)
    if not extracted_text or len(extracted_text.strip()) < 20:
        raise HTTPException(status_code=422, detail="Could not extract readable text from file")

    results = await parse_lab_report(extracted_text)
    if not results:
        raise HTTPException(
            status_code=422,
            detail="No recognized biomarkers found. Try a clearer scan or a text-based PDF.",
        )

    flagged = [r for r in results if r["flag"] != "normal"]
    return {
        "results": results,
        "total": len(results),
        "flagged_count": len(flagged),
        "raw_text_preview": extracted_text[:400],
    }
