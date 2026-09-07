import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from backend.api.dependencies import get_current_user
from backend.config.settings import settings

router = APIRouter()

_DEEPGRAM_URL = "https://api.deepgram.com/v1/listen"
_ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"

# Strip markdown so TTS reads naturally
def _strip_markdown(text: str) -> str:
    import re
    text = re.sub(r"#{1,6}\s+", "", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"`(.+?)`", r"\1", text)
    text = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", text)
    text = re.sub(r"^\s*[-*•]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\d+\.\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# Truncate to ~1500 chars at a sentence boundary for voice
def _voice_truncate(text: str, max_chars: int = 1500) -> str:
    if len(text) <= max_chars:
        return text
    cutoff = text.rfind(".", 0, max_chars)
    if cutoff == -1:
        cutoff = max_chars
    return text[: cutoff + 1].strip()


@router.post("/voice/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    _: str = Depends(get_current_user),
):
    if not settings.deepgram_api_key:
        raise HTTPException(status_code=503, detail="Deepgram API key not configured")

    audio_bytes = await audio.read()
    content_type = audio.content_type or "audio/webm"

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            _DEEPGRAM_URL,
            headers={
                "Authorization": f"Token {settings.deepgram_api_key}",
                "Content-Type": content_type,
            },
            params={
                "model": "nova-2",
                "smart_format": "true",
                "language": "en",
                "punctuate": "true",
            },
            content=audio_bytes,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Deepgram transcription failed")

    result = resp.json()
    try:
        transcript = result["results"]["channels"][0]["alternatives"][0]["transcript"]
    except (KeyError, IndexError):
        transcript = ""

    return {"transcript": transcript.strip()}


class SynthesizeRequest(BaseModel):
    text: str


@router.post("/voice/synthesize")
async def synthesize_speech(
    body: SynthesizeRequest,
    _: str = Depends(get_current_user),
):
    if not settings.elevenlabs_api_key:
        raise HTTPException(status_code=503, detail="ElevenLabs API key not configured")

    cleaned = _strip_markdown(body.text)
    truncated = _voice_truncate(cleaned)

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            _ELEVENLABS_URL.format(voice_id=settings.elevenlabs_voice_id),
            headers={
                "xi-api-key": settings.elevenlabs_api_key,
                "Content-Type": "application/json",
            },
            json={
                "text": truncated,
                "model_id": "eleven_turbo_v2_5",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True,
                },
            },
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="ElevenLabs synthesis failed")

    return Response(
        content=resp.content,
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-store"},
    )
