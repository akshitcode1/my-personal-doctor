import io

import pymupdf as fitz
import pytesseract
from PIL import Image

from backend.config.constants import MAX_DOCUMENT_CONTEXT_CHARS


class PDFProcessor:
    MIN_DIGITAL_TEXT_CHARS = 50
    OCR_ZOOM_FACTOR = 2

    def extract_text(self, pdf_bytes: bytes) -> str:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page_texts: list[str] = []

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text().strip()

            if len(text) < self.MIN_DIGITAL_TEXT_CHARS:
                # Scanned/image page — render at 2x zoom and run OCR
                mat = fitz.Matrix(self.OCR_ZOOM_FACTOR, self.OCR_ZOOM_FACTOR)
                pix = page.get_pixmap(matrix=mat)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                text = pytesseract.image_to_string(img).strip()

            if text:
                page_texts.append(f"[Page {page_num + 1}]\n{text}")

        doc.close()
        return "\n\n".join(page_texts)

    def chunk_for_context(self, full_text: str) -> str:
        if len(full_text) <= MAX_DOCUMENT_CONTEXT_CHARS:
            return full_text
        return full_text[:MAX_DOCUMENT_CONTEXT_CHARS] + "\n\n[Document truncated for context window]"


processor = PDFProcessor()
