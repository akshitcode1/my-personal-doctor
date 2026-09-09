from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import auth, chats, documents, health, messages, voice
from backend.api.routes import lab_reports, timeline, followups
from backend.api.websocket import websocket_endpoint
from backend.config.settings import settings

app = FastAPI(
    title="My Personal Doctor API",
    version="2.0.0",
    description="Multi-agent AI healthcare consultation system",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,       prefix="/api", tags=["health"])
app.include_router(auth.router,         prefix="/api", tags=["auth"])
app.include_router(chats.router,        prefix="/api", tags=["chats"])
app.include_router(messages.router,     prefix="/api", tags=["messages"])
app.include_router(documents.router,    prefix="/api", tags=["documents"])
app.include_router(voice.router,        prefix="/api", tags=["voice"])
app.include_router(lab_reports.router,  prefix="/api", tags=["lab-reports"])
app.include_router(timeline.router,     prefix="/api", tags=["timeline"])
app.include_router(followups.router,    prefix="/api", tags=["follow-ups"])

app.add_api_websocket_route("/ws/{chat_id}", websocket_endpoint)
